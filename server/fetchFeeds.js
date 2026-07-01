import Parser from "rss-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { insertArticle, listFeeds, setFeedFetchResult } from "./db.js";
import { cleanText, scoreArticle, tagArticle } from "./tagger.js";

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

const parser = new Parser({
  timeout: 20000
});

const REQUEST_HEADERS = {
  "User-Agent": "PersonalLearningRSS/0.1 (+local dashboard)",
  Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*"
};

const FEED_TIMEOUT_MS = Number(process.env.FEED_TIMEOUT_MS || 45000);
const FETCH_CONCURRENCY = Math.max(1, Number(process.env.FETCH_CONCURRENCY || 6));

function normalizeDate(item) {
  const value = item.isoDate || item.pubDate || item.published || item.updated;
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
}

function normalizeItem(item, feed) {
  const url = item.link || item.guid || item.id;
  if (!url || !item.title) return null;

  const summary = cleanText(item.contentSnippet || item.summary || item.content || item.description || "");
  const content = cleanText(item["content:encoded"] || item.content || item.description || "");

  return {
    feed_id: feed.id,
    category_id: feed.category_id,
    title: cleanText(item.title),
    url,
    author: cleanText(item.creator || item.author || ""),
    summary,
    content,
    published_at: normalizeDate(item)
  };
}

export async function fetchFeed(feed) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(feed.url, {
      headers: REQUEST_HEADERS,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const safeXml = xml.replace(/&(?!#?[a-zA-Z0-9]+;)/g, "&amp;");
  const parsed = await parser.parseString(safeXml);
  let inserted = 0;

  for (const item of parsed.items || []) {
    const article = normalizeItem(item, feed);
    if (!article) continue;

    const tags = tagArticle(article, feed);
    article.score = scoreArticle(article, feed, tags);
    insertArticle(article, tags);
    inserted += 1;
  }

  setFeedFetchResult(feed.id, null);
  return { feedId: feed.id, title: feed.title, inserted, error: null };
}

export async function fetchAllFeeds() {
  const feeds = listFeeds({ activeOnly: true });
  const results = [];
  let index = 0;

  // Bounded concurrency keeps refreshes quick without hammering publishers.
  async function worker() {
    while (index < feeds.length) {
      const feed = feeds[index];
      index += 1;

      try {
        results.push(await fetchFeed(feed));
      } catch (error) {
        const message = error?.name === "AbortError" ? `Timed out after ${FEED_TIMEOUT_MS}ms` : error?.message || String(error);
        setFeedFetchResult(feed.id, message);
        results.push({ feedId: feed.id, title: feed.title, inserted: 0, error: message });
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(FETCH_CONCURRENCY, feeds.length) }, () => worker())
  );

  return results;
}

if (isDirectRun) {
  const results = await fetchAllFeeds();
  const ok = results.filter((result) => !result.error).length;
  const failed = results.length - ok;
  const articles = results.reduce((sum, result) => sum + result.inserted, 0);

  console.log(`Fetched ${results.length} feeds: ${ok} ok, ${failed} failed, ${articles} articles processed.`);
  for (const result of results.filter((item) => item.error)) {
    console.log(`- ${result.title}: ${result.error}`);
  }
}
