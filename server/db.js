import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const dbPath = process.env.DB_PATH || path.join(dataDir, "learning-rss.sqlite");

mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec(readFileSync(path.join(__dirname, "schema.sql"), "utf8"));

export function getDbPath() {
  return dbPath;
}

export function nowIso() {
  return new Date().toISOString();
}

export function upsertCategory(category) {
  db.prepare(`
    INSERT INTO categories (id, name, description, color, sort_order)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      color = excluded.color,
      sort_order = excluded.sort_order
  `).run(
    category.id,
    category.name,
    category.description || "",
    category.color || "#64748b",
    category.sortOrder || 0
  );
}

export function upsertFeed(feed, categoryId) {
  db.prepare(`
    INSERT INTO feeds (id, category_id, title, url, site_url, notes, project_interest, active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      category_id = excluded.category_id,
      title = excluded.title,
      url = excluded.url,
      site_url = excluded.site_url,
      notes = excluded.notes,
      project_interest = excluded.project_interest,
      active = excluded.active
  `).run(
    feed.id,
    categoryId,
    feed.title,
    feed.url,
    feed.siteUrl || "",
    feed.notes || "",
    feed.projectInterest ? 1 : 0,
    feed.active === false ? 0 : 1
  );
}

export function listFeeds({ activeOnly = false } = {}) {
  const sql = `
    SELECT
      f.*,
      c.name AS category_name,
      c.color AS category_color
    FROM feeds f
    JOIN categories c ON c.id = f.category_id
    ${activeOnly ? "WHERE f.active = 1" : ""}
    ORDER BY c.sort_order, f.title
  `;
  return db.prepare(sql).all();
}

export function setFeedFetchResult(feedId, error = null) {
  db.prepare(`
    UPDATE feeds
    SET last_fetched_at = ?, last_error = ?
    WHERE id = ?
  `).run(nowIso(), error, feedId);
}

export function insertArticle(article, tags) {
  const inserted = db.prepare(`
    INSERT INTO articles (
      feed_id, category_id, title, url, author, summary, content, published_at, score
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(url) DO UPDATE SET
      title = excluded.title,
      author = excluded.author,
      summary = excluded.summary,
      content = excluded.content,
      published_at = COALESCE(excluded.published_at, articles.published_at),
      score = excluded.score
    RETURNING id
  `).get(
    article.feed_id,
    article.category_id,
    article.title,
    article.url,
    article.author || "",
    article.summary || "",
    article.content || "",
    article.published_at || null,
    article.score || 0
  );

  const articleId = inserted.id;
  db.prepare("DELETE FROM article_tags WHERE article_id = ?").run(articleId);
  const insertTag = db.prepare("INSERT OR IGNORE INTO article_tags (article_id, tag) VALUES (?, ?)");
  for (const tag of tags) {
    insertTag.run(articleId, tag);
  }

  return articleId;
}

export function getDashboardMeta() {
  const categories = db.prepare(`
    SELECT
      c.id,
      c.name,
      c.description,
      c.color,
      c.sort_order AS sortOrder,
      COUNT(a.id) AS articleCount,
      SUM(CASE WHEN a.is_read = 0 THEN 1 ELSE 0 END) AS unreadCount
    FROM categories c
    LEFT JOIN articles a ON a.category_id = c.id
    GROUP BY c.id
    ORDER BY c.sort_order
  `).all();

  const feeds = db.prepare(`
    SELECT
      f.id,
      f.category_id AS categoryId,
      f.title,
      f.url,
      f.site_url AS siteUrl,
      f.notes,
      f.project_interest AS projectInterest,
      f.active,
      f.last_fetched_at AS lastFetchedAt,
      f.last_error AS lastError,
      COUNT(a.id) AS articleCount,
      SUM(CASE WHEN a.is_read = 0 THEN 1 ELSE 0 END) AS unreadCount
    FROM feeds f
    LEFT JOIN articles a ON a.feed_id = f.id
    GROUP BY f.id
    ORDER BY f.title
  `).all();

  const totals = db.prepare(`
    SELECT
      COUNT(*) AS articleCount,
      SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) AS unreadCount,
      SUM(CASE WHEN is_saved = 1 THEN 1 ELSE 0 END) AS savedCount,
      SUM(CASE WHEN is_important = 1 THEN 1 ELSE 0 END) AS importantCount
    FROM articles
  `).get();

  const tags = db.prepare(`
    SELECT tag, COUNT(*) AS count
    FROM article_tags
    GROUP BY tag
    ORDER BY count DESC, tag
    LIMIT 40
  `).all();

  return { categories, feeds, tags, totals };
}

function buildArticleWhere(filters) {
  const clauses = [];
  const params = [];

  if (filters.category) {
    clauses.push("a.category_id = ?");
    params.push(filters.category);
  }
  if (filters.source) {
    clauses.push("a.feed_id = ?");
    params.push(filters.source);
  }
  if (filters.status === "unread") clauses.push("a.is_read = 0");
  if (filters.status === "read") clauses.push("a.is_read = 1");
  if (filters.status === "saved") clauses.push("a.is_saved = 1");
  if (filters.status === "important") clauses.push("a.is_important = 1");
  if (filters.keyword) {
    clauses.push("(a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ?)");
    const keyword = `%${filters.keyword}%`;
    params.push(keyword, keyword, keyword);
  }
  if (filters.tag) {
    clauses.push("EXISTS (SELECT 1 FROM article_tags at WHERE at.article_id = a.id AND at.tag = ?)");
    params.push(filters.tag);
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params
  };
}

export function listArticles(filters = {}) {
  const { where, params } = buildArticleWhere(filters);
  const limit = Math.min(Number(filters.limit) || 50, 100);
  const offset = Number(filters.offset) || 0;

  const articles = db.prepare(`
    SELECT
      a.*,
      f.title AS feed_title,
      f.site_url AS feed_site_url,
      c.name AS category_name,
      c.color AS category_color,
      GROUP_CONCAT(t.tag) AS tags
    FROM articles a
    JOIN feeds f ON f.id = a.feed_id
    JOIN categories c ON c.id = a.category_id
    LEFT JOIN article_tags t ON t.article_id = a.id
    ${where}
    GROUP BY a.id
    ORDER BY
      COALESCE(a.published_at, a.fetched_at) DESC,
      a.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  return articles.map(normalizeArticle);
}

export function getLearningQueue(limit = 8) {
  const candidates = db.prepare(`
    SELECT
      a.*,
      f.title AS feed_title,
      f.site_url AS feed_site_url,
      c.name AS category_name,
      c.color AS category_color,
      GROUP_CONCAT(t.tag) AS tags
    FROM articles a
    JOIN feeds f ON f.id = a.feed_id
    JOIN categories c ON c.id = a.category_id
    LEFT JOIN article_tags t ON t.article_id = a.id
    WHERE a.is_read = 0
    GROUP BY a.id
    ORDER BY
      a.is_important DESC,
      a.is_saved DESC,
      a.score DESC,
      COALESCE(a.published_at, a.fetched_at) DESC
    LIMIT 120
  `).all().map(normalizeArticle);

  const chosen = [];
  const usedCategories = new Set();

  // First pass: one high-scoring unread article per category.
  for (const article of candidates) {
    if (chosen.length >= limit) break;
    if (!usedCategories.has(article.category_id)) {
      chosen.push(article);
      usedCategories.add(article.category_id);
    }
  }

  // Second pass: fill the remaining slots with the best unread articles.
  for (const article of candidates) {
    if (chosen.length >= limit) break;
    if (!chosen.some((item) => item.id === article.id)) {
      chosen.push(article);
    }
  }

  return chosen;
}

export function updateArticleStatus(id, patch) {
  const allowed = {
    isRead: "is_read",
    isSaved: "is_saved",
    isImportant: "is_important"
  };

  const entries = Object.entries(patch).filter(([key]) => allowed[key]);
  if (!entries.length) return null;

  const sets = entries.map(([key]) => `${allowed[key]} = ?`);
  const params = entries.map(([, value]) => (value ? 1 : 0));
  db.prepare(`UPDATE articles SET ${sets.join(", ")} WHERE id = ?`).run(...params, id);

  const article = db.prepare(`
    SELECT
      a.*,
      f.title AS feed_title,
      f.site_url AS feed_site_url,
      c.name AS category_name,
      c.color AS category_color,
      GROUP_CONCAT(t.tag) AS tags
    FROM articles a
    JOIN feeds f ON f.id = a.feed_id
    JOIN categories c ON c.id = a.category_id
    LEFT JOIN article_tags t ON t.article_id = a.id
    WHERE a.id = ?
    GROUP BY a.id
  `).get(id);

  return article ? normalizeArticle(article) : null;
}

function normalizeArticle(row) {
  return {
    ...row,
    tags: row.tags ? row.tags.split(",").filter(Boolean).sort() : [],
    is_read: Boolean(row.is_read),
    is_saved: Boolean(row.is_saved),
    is_important: Boolean(row.is_important)
  };
}
