import React from "react";
import { createRoot } from "react-dom/client";
import {
  Bookmark,
  CheckCircle2,
  Circle,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  Star,
  Tag
} from "lucide-react";
import "./styles.css";

const API = "";

function formatDate(value) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

async function api(path, options) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

function App() {
  const [meta, setMeta] = React.useState(null);
  const [articles, setArticles] = React.useState([]);
  const [queue, setQueue] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [fetching, setFetching] = React.useState(false);
  const [error, setError] = React.useState("");
  const [filters, setFilters] = React.useState({
    category: "",
    source: "",
    status: "unread",
    keyword: "",
    tag: ""
  });

  const load = React.useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const query = new URLSearchParams(
        Object.entries(filters).filter(([, value]) => value)
      ).toString();
      const [nextMeta, nextArticles, nextQueue] = await Promise.all([
        api("/api/meta"),
        api(`/api/articles?${query}`),
        api("/api/learning-queue?limit=8")
      ]);
      setMeta(nextMeta);
      setArticles(nextArticles);
      setQueue(nextQueue);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function fetchNow() {
    setFetching(true);
    setError("");
    try {
      await api("/api/fetch", { method: "POST" });
      await load();
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setFetching(false);
    }
  }

  async function patchArticle(article, patch) {
    const updated = await api(`/api/articles/${article.id}`, {
      method: "PATCH",
      body: JSON.stringify(patch)
    });

    setArticles((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    setQueue((items) => items.filter((item) => item.id !== updated.id || !updated.is_read));
    setMeta(await api("/api/meta"));
  }

  const categoryFeeds = React.useMemo(() => {
    if (!meta) return [];
    return filters.category
      ? meta.feeds.filter((feed) => feed.categoryId === filters.category)
      : meta.feeds;
  }, [meta, filters.category]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Personal learning RSS</p>
          <h1>Learning Dashboard</h1>
        </div>
        <div className="topbar-actions">
          <div className="stat">
            <strong>{meta?.totals?.unreadCount || 0}</strong>
            <span>unread</span>
          </div>
          <div className="stat">
            <strong>{meta?.totals?.savedCount || 0}</strong>
            <span>saved</span>
          </div>
          <button className="primary" onClick={fetchNow} disabled={fetching} title="Fetch latest RSS articles">
            <RefreshCw size={18} className={fetching ? "spin" : ""} />
            {fetching ? "Fetching" : "Fetch now"}
          </button>
        </div>
      </header>

      {error && <div className="notice">{error}</div>}

      <section className="layout">
        <aside className="sidebar">
          <section className="filter-section">
            <h2>Categories</h2>
            <button
              className={`nav-item ${filters.category === "" ? "active" : ""}`}
              onClick={() => setFilters((value) => ({ ...value, category: "", source: "" }))}
            >
              <span className="dot all" />
              All interests
              <strong>{meta?.totals?.articleCount || 0}</strong>
            </button>
            {meta?.categories.map((category) => (
              <button
                key={category.id}
                className={`nav-item ${filters.category === category.id ? "active" : ""}`}
                onClick={() => setFilters((value) => ({ ...value, category: category.id, source: "" }))}
              >
                <span className="dot" style={{ background: category.color }} />
                {category.name}
                <strong>{category.unreadCount || 0}</strong>
              </button>
            ))}
          </section>

          <section className="filter-section">
            <h2>Sources</h2>
            <select
              value={filters.source}
              onChange={(event) => setFilters((value) => ({ ...value, source: event.target.value }))}
            >
              <option value="">All sources</option>
              {categoryFeeds.map((feed) => (
                <option key={feed.id} value={feed.id}>
                  {feed.title}
                </option>
              ))}
            </select>
          </section>

          <section className="filter-section">
            <h2>Tags</h2>
            <div className="tag-cloud">
              <button
                className={filters.tag === "" ? "tag-button active" : "tag-button"}
                onClick={() => setFilters((value) => ({ ...value, tag: "" }))}
              >
                Any
              </button>
              {meta?.tags.slice(0, 18).map((tag) => (
                <button
                  key={tag.tag}
                  className={filters.tag === tag.tag ? "tag-button active" : "tag-button"}
                  onClick={() => setFilters((value) => ({ ...value, tag: tag.tag }))}
                >
                  {tag.tag}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="content">
          <section className="queue-band">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Today</p>
                <h2>Learning Queue</h2>
              </div>
              <span>{queue.length} picks</span>
            </div>
            <div className="queue-list">
              {queue.length === 0 && <p className="muted">Fetch feeds to build a queue.</p>}
              {queue.map((article) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  compact
                  onPatch={patchArticle}
                />
              ))}
            </div>
          </section>

          <section className="toolbar">
            <div className="search-box">
              <Search size={18} />
              <input
                value={filters.keyword}
                onChange={(event) => setFilters((value) => ({ ...value, keyword: event.target.value }))}
                placeholder="Search articles, summaries, or tags"
              />
            </div>
            <div className="segmented" aria-label="Status filter">
              {["all", "unread", "saved", "important"].map((status) => (
                <button
                  key={status}
                  className={filters.status === (status === "all" ? "" : status) ? "active" : ""}
                  onClick={() => setFilters((value) => ({ ...value, status: status === "all" ? "" : status }))}
                >
                  <Filter size={15} />
                  {status}
                </button>
              ))}
            </div>
          </section>

          <section className="article-list">
            {loading && <p className="muted">Loading articles...</p>}
            {!loading && articles.length === 0 && <p className="muted">No articles match these filters.</p>}
            {!loading &&
              articles.map((article) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  onPatch={patchArticle}
                />
              ))}
          </section>
        </section>
      </section>
    </main>
  );
}

function ArticleRow({ article, onPatch, compact = false }) {
  return (
    <article className={`article-card ${compact ? "compact" : ""}`}>
      <div className="article-main">
        <div className="article-meta">
          <span className="category-pill" style={{ "--pill-color": article.category_color }}>
            {article.category_name}
          </span>
          <span>{article.feed_title}</span>
          <span>{formatDate(article.published_at || article.fetched_at)}</span>
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="article-title"
          onClick={() => onPatch(article, { isRead: true })}
        >
          {article.title}
          <ExternalLink size={15} />
        </a>
        {!compact && article.summary && <p className="summary">{article.summary}</p>}
        {!compact && article.tags.length > 0 && (
          <div className="article-tags">
            <Tag size={14} />
            {article.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div className="article-actions">
        <button
          className={article.is_read ? "icon-button active" : "icon-button"}
          onClick={() => onPatch(article, { isRead: !article.is_read })}
          title={article.is_read ? "Mark unread" : "Mark read"}
        >
          {article.is_read ? <CheckCircle2 size={19} /> : <Circle size={19} />}
        </button>
        <button
          className={article.is_saved ? "icon-button active" : "icon-button"}
          onClick={() => onPatch(article, { isSaved: !article.is_saved })}
          title={article.is_saved ? "Remove saved" : "Save article"}
        >
          <Bookmark size={19} />
        </button>
        <button
          className={article.is_important ? "icon-button active important" : "icon-button"}
          onClick={() => onPatch(article, { isImportant: !article.is_important })}
          title={article.is_important ? "Remove important" : "Mark important"}
        >
          <Star size={19} />
        </button>
      </div>
    </article>
  );
}

createRoot(document.getElementById("root")).render(<App />);
