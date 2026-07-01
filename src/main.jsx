import React from "react";
import { createRoot } from "react-dom/client";
import {
  Bookmark,
  CheckCircle2,
  Circle,
  ExternalLink,
  Filter,
  Plus,
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
  if (!response.ok) {
    const message = await response.text();
    let errorMessage = message;
    try {
      errorMessage = JSON.parse(message).error || message;
    } catch {}
    throw new Error(errorMessage);
  }
  return response.json();
}

function App() {
  const [meta, setMeta] = React.useState(null);
  const [articles, setArticles] = React.useState([]);
  const [queue, setQueue] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [fetching, setFetching] = React.useState(false);
  const [error, setError] = React.useState("");
  const [discovering, setDiscovering] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState([]);
  const [catalogTags, setCatalogTags] = React.useState([]);
  const [discoveryQuery, setDiscoveryQuery] = React.useState("");
  const [categoryForm, setCategoryForm] = React.useState({
    name: "",
    description: "",
    color: "#2563eb"
  });
  const [feedForm, setFeedForm] = React.useState({
    title: "",
    url: "",
    categoryId: ""
  });
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

  React.useEffect(() => {
    discoverFeeds("");
  }, []);

  React.useEffect(() => {
    if (!feedForm.categoryId && meta?.categories?.length) {
      setFeedForm((value) => ({ ...value, categoryId: meta.categories[0].id }));
    }
  }, [feedForm.categoryId, meta]);

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

  async function submitCategory(event) {
    event.preventDefault();
    setError("");
    try {
      const category = await api("/api/categories", {
        method: "POST",
        body: JSON.stringify(categoryForm)
      });
      setCategoryForm({ name: "", description: "", color: "#2563eb" });
      setFilters((value) => ({ ...value, category: category.id, source: "" }));
      setFeedForm((value) => ({ ...value, categoryId: category.id }));
      await load();
    } catch (categoryError) {
      setError(categoryError.message);
    }
  }

  async function submitFeed(event) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/feeds", {
        method: "POST",
        body: JSON.stringify({
          ...feedForm,
          categoryId: feedForm.categoryId || filters.category || meta?.categories?.[0]?.id
        })
      });
      setFeedForm((value) => ({ ...value, title: "", url: "" }));
      await load();
    } catch (feedError) {
      setError(feedError.message);
    }
  }

  async function discoverFeeds(query = discoveryQuery) {
    setDiscovering(true);
    setError("");
    try {
      const data = await api(`/api/feed-suggestions?${new URLSearchParams({ query, limit: "12" })}`);
      setSuggestions(data.suggestions || []);
      setCatalogTags(data.tags || []);
    } catch (discoverError) {
      setError(discoverError.message);
    } finally {
      setDiscovering(false);
    }
  }

  async function addSuggestedFeed(feed) {
    setError("");
    try {
      await api("/api/feeds", {
        method: "POST",
        body: JSON.stringify({
          title: feed.title,
          url: feed.url,
          siteUrl: feed.siteUrl,
          notes: feed.notes,
          priority: false,
          categoryId: feedForm.categoryId || filters.category || meta?.categories?.[0]?.id
        })
      });
      await load();
      await discoverFeeds(discoveryQuery);
    } catch (feedError) {
      setError(feedError.message);
    }
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
          <p className="eyebrow">Learning RSS</p>
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
            <form className="stacked-form" onSubmit={submitCategory}>
              <label>
                Add category
                <input
                  value={categoryForm.name}
                  onChange={(event) => setCategoryForm((value) => ({ ...value, name: event.target.value }))}
                  placeholder="Example: Design Systems"
                  required
                />
              </label>
              <label>
                Description
                <textarea
                  value={categoryForm.description}
                  onChange={(event) => setCategoryForm((value) => ({ ...value, description: event.target.value }))}
                  placeholder="What this interest area should collect"
                  rows={3}
                />
              </label>
              <div className="form-row">
                <label>
                  Color
                  <input
                    type="color"
                    value={categoryForm.color}
                    onChange={(event) => setCategoryForm((value) => ({ ...value, color: event.target.value }))}
                  />
                </label>
                <button className="secondary" type="submit">
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </form>
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
            <form className="stacked-form" onSubmit={submitFeed}>
              <label>
                Add feed
                <input
                  value={feedForm.title}
                  onChange={(event) => setFeedForm((value) => ({ ...value, title: event.target.value }))}
                  placeholder="Feed title"
                  required
                />
              </label>
              <label>
                RSS URL
                <input
                  type="url"
                  value={feedForm.url}
                  onChange={(event) => setFeedForm((value) => ({ ...value, url: event.target.value }))}
                  placeholder="https://example.com/feed.xml"
                  required
                />
              </label>
              <label>
                Category
                <select
                  value={feedForm.categoryId || filters.category || meta?.categories?.[0]?.id || ""}
                  onChange={(event) => setFeedForm((value) => ({ ...value, categoryId: event.target.value }))}
                >
                  {meta?.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="secondary" type="submit">
                <Plus size={16} />
                Add feed
              </button>
            </form>
            <div className="discovery-panel">
              <h3>Discover feeds</h3>
              <form
                className="discovery-search"
                onSubmit={(event) => {
                  event.preventDefault();
                  discoverFeeds();
                }}
              >
                <div className="search-box compact-search">
                  <Search size={16} />
                  <input
                    value={discoveryQuery}
                    onChange={(event) => setDiscoveryQuery(event.target.value)}
                    placeholder="Interest, tag, or website URL"
                  />
                </div>
                <button className="secondary" type="submit" disabled={discovering}>
                  {discovering ? "Searching" : "Search"}
                </button>
              </form>
              <div className="tag-cloud compact-tags">
                {catalogTags.slice(0, 14).map((tag) => (
                  <button
                    key={tag.tag}
                    type="button"
                    className="tag-button"
                    onClick={() => {
                      setDiscoveryQuery(tag.tag);
                      discoverFeeds(tag.tag);
                    }}
                  >
                    {tag.tag}
                  </button>
                ))}
              </div>
              <div className="suggestion-list">
                {suggestions.slice(0, 6).map((feed) => (
                  <div className="suggestion-item" key={feed.id}>
                    <div>
                      <strong>{feed.title}</strong>
                      <p>{feed.notes}</p>
                      <div className="mini-tags">
                        {feed.tags.slice(0, 4).map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      className="secondary"
                      type="button"
                      onClick={() => addSuggestedFeed(feed)}
                      disabled={feed.added}
                      title={feed.added ? "This feed is already in your source list" : "Add this feed"}
                    >
                      {feed.added ? "Added" : "Add"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
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
