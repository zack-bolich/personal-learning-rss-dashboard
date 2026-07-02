import { listFeeds } from "./db.js";

const REQUEST_TIMEOUT_MS = 12000;

const FEED_CATALOG = [
  {
    id: "mdn-blog",
    title: "MDN Blog",
    url: "https://developer.mozilla.org/en-US/blog/rss.xml",
    siteUrl: "https://developer.mozilla.org/en-US/blog/",
    notes: "Web platform, browser APIs, CSS, JavaScript, and developer education.",
    tags: ["web", "javascript", "css", "html", "frontend", "browser", "documentation"]
  },
  {
    id: "web-dev",
    title: "web.dev",
    url: "https://web.dev/feed.xml",
    siteUrl: "https://web.dev/",
    notes: "Performance, accessibility, SEO, browser capabilities, and modern web guidance.",
    tags: ["web", "frontend", "performance", "accessibility", "seo", "chrome"]
  },
  {
    id: "smashing-magazine",
    title: "Smashing Magazine",
    url: "https://www.smashingmagazine.com/feed/",
    siteUrl: "https://www.smashingmagazine.com/",
    notes: "Design, frontend development, UX, accessibility, and product craft.",
    tags: ["design", "frontend", "ux", "css", "accessibility", "web"]
  },
  {
    id: "css-tricks",
    title: "CSS-Tricks",
    url: "https://css-tricks.com/feed/",
    siteUrl: "https://css-tricks.com/",
    notes: "CSS, frontend patterns, layout, and web design techniques.",
    tags: ["css", "frontend", "design", "web", "layout"]
  },
  {
    id: "typescript-blog",
    title: "TypeScript Blog",
    url: "https://devblogs.microsoft.com/typescript/feed/",
    siteUrl: "https://devblogs.microsoft.com/typescript/",
    notes: "TypeScript language releases and compiler updates.",
    tags: ["typescript", "javascript", "frontend", "node", "developer-tools"]
  },
  {
    id: "v8-blog",
    title: "V8 Blog",
    url: "https://v8.dev/blog.atom",
    siteUrl: "https://v8.dev/blog",
    notes: "JavaScript engine internals, performance, and language implementation.",
    tags: ["javascript", "performance", "browser", "runtime", "developer-tools"]
  },
  {
    id: "node-weekly",
    title: "Node Weekly",
    url: "https://nodeweekly.com/rss",
    siteUrl: "https://nodeweekly.com/",
    notes: "Node.js news, packages, tutorials, and releases.",
    tags: ["node", "javascript", "backend", "express", "developer-tools"]
  },
  {
    id: "javascript-weekly",
    title: "JavaScript Weekly",
    url: "https://javascriptweekly.com/rss",
    siteUrl: "https://javascriptweekly.com/",
    notes: "JavaScript news, tutorials, libraries, and ecosystem updates.",
    tags: ["javascript", "frontend", "node", "react", "developer-tools"]
  },
  {
    id: "react-status",
    title: "React Status",
    url: "https://react.statuscode.com/rss",
    siteUrl: "https://react.statuscode.com/",
    notes: "React ecosystem news, components, releases, and tutorials.",
    tags: ["react", "javascript", "frontend", "ui"]
  },
  {
    id: "frontend-focus",
    title: "Frontend Focus",
    url: "https://frontendfoc.us/rss",
    siteUrl: "https://frontendfoc.us/",
    notes: "HTML, CSS, browser APIs, and frontend engineering news.",
    tags: ["frontend", "html", "css", "javascript", "web"]
  },
  {
    id: "pycoders",
    title: "Pycoder's Weekly",
    url: "https://pycoders.com/feed/",
    siteUrl: "https://pycoders.com/",
    notes: "Python news, tutorials, libraries, and community posts.",
    tags: ["python", "django", "data", "backend", "developer-tools"]
  },
  {
    id: "python-weekly",
    title: "Python Weekly",
    url: "https://www.pythonweekly.com/rss",
    siteUrl: "https://www.pythonweekly.com/",
    notes: "Python articles, projects, releases, and community updates.",
    tags: ["python", "backend", "data", "machine-learning"]
  },
  {
    id: "django-news",
    title: "Django News",
    url: "https://django-news.com/issues.rss",
    siteUrl: "https://django-news.com/",
    notes: "Django articles, releases, packages, and community links.",
    tags: ["django", "python", "backend", "web"]
  },
  {
    id: "postgres-weekly",
    title: "Postgres Weekly",
    url: "https://postgresweekly.com/rss",
    siteUrl: "https://postgresweekly.com/",
    notes: "PostgreSQL news, tips, releases, and database engineering.",
    tags: ["database", "postgres", "sql", "backend"]
  },
  {
    id: "database-weekly",
    title: "Database Weekly",
    url: "https://dbweekly.com/rss",
    siteUrl: "https://dbweekly.com/",
    notes: "Database systems, SQL, NoSQL, data engineering, and storage.",
    tags: ["database", "sql", "mongodb", "postgres", "data"]
  },
  {
    id: "kdnuggets",
    title: "KDnuggets",
    url: "https://www.kdnuggets.com/feed",
    siteUrl: "https://www.kdnuggets.com/",
    notes: "Data science, machine learning, analytics, and applied AI articles.",
    tags: ["data", "machine-learning", "ai", "analytics", "python"]
  },
  {
    id: "google-ai-blog",
    title: "Google AI Blog",
    url: "https://blog.google/technology/ai/rss/",
    siteUrl: "https://blog.google/technology/ai/",
    notes: "AI research, product updates, and applied machine learning from Google.",
    tags: ["ai", "machine-learning", "research", "automation"]
  },
  {
    id: "anthropic-news",
    title: "Anthropic News",
    url: "https://www.anthropic.com/news/rss.xml",
    siteUrl: "https://www.anthropic.com/news",
    notes: "AI safety, models, product updates, and research notes.",
    tags: ["ai", "llm", "research", "automation"]
  },
  {
    id: "replicate-blog",
    title: "Replicate Blog",
    url: "https://replicate.com/blog/rss",
    siteUrl: "https://replicate.com/blog",
    notes: "Model deployment, image/video generation, inference, and AI apps.",
    tags: ["ai", "inference", "image-generation", "automation", "developer-tools"]
  },
  {
    id: "a16z-ai",
    title: "a16z AI",
    url: "https://a16z.com/category/ai/feed/",
    siteUrl: "https://a16z.com/category/ai/",
    notes: "AI market analysis, product strategy, infrastructure, and investing context.",
    tags: ["ai", "strategy", "startups", "automation", "investing"]
  },
  {
    id: "ux-collective",
    title: "UX Collective",
    url: "https://uxdesign.cc/feed",
    siteUrl: "https://uxdesign.cc/",
    notes: "UX design, product thinking, research, and interface critique.",
    tags: ["ux", "design", "product", "research"]
  },
  {
    id: "nngroup",
    title: "Nielsen Norman Group",
    url: "https://www.nngroup.com/feed/rss/",
    siteUrl: "https://www.nngroup.com/articles/",
    notes: "User research, usability, interaction design, and UX methods.",
    tags: ["ux", "design", "research", "product", "accessibility"]
  },
  {
    id: "product-talk",
    title: "Product Talk",
    url: "https://www.producttalk.org/feed/",
    siteUrl: "https://www.producttalk.org/",
    notes: "Product discovery, continuous research, and product decision-making.",
    tags: ["product", "research", "strategy", "ux"]
  },
  {
    id: "lennys-newsletter",
    title: "Lenny's Newsletter",
    url: "https://www.lennysnewsletter.com/feed",
    siteUrl: "https://www.lennysnewsletter.com/",
    notes: "Product management, growth, startups, and team operating lessons.",
    tags: ["product", "growth", "startups", "strategy"]
  },
  {
    id: "moz-blog",
    title: "Moz Blog",
    url: "https://moz.com/blog/feed",
    siteUrl: "https://moz.com/blog",
    notes: "SEO strategy, search visibility, content, and analytics.",
    tags: ["seo", "marketing", "content", "analytics", "web"]
  },
  {
    id: "content-marketing-institute",
    title: "Content Marketing Institute",
    url: "https://contentmarketinginstitute.com/feed/",
    siteUrl: "https://contentmarketinginstitute.com/",
    notes: "Content strategy, editorial planning, marketing, and audience development.",
    tags: ["marketing", "content", "seo", "publishing"]
  },
  {
    id: "accessibility-weekly",
    title: "Accessibility Weekly",
    url: "https://a11yweekly.com/feed/",
    siteUrl: "https://a11yweekly.com/",
    notes: "Accessibility articles, tooling, standards, and inclusive design.",
    tags: ["accessibility", "a11y", "web", "design", "frontend"]
  },
  {
    id: "nonprofit-quarterly",
    title: "Nonprofit Quarterly",
    url: "https://nonprofitquarterly.org/feed/",
    siteUrl: "https://nonprofitquarterly.org/",
    notes: "Nonprofit strategy, governance, fundraising, and sector analysis.",
    tags: ["nonprofit", "fundraising", "strategy", "publishing"]
  },
  {
    id: "calendly-blog",
    title: "Calendly Blog",
    url: "https://calendly.com/blog/rss.xml",
    siteUrl: "https://calendly.com/blog",
    notes: "Scheduling, operations, workflow automation, and productivity.",
    tags: ["automation", "productivity", "workflow", "operations"]
  },
  {
    id: "zapier-blog",
    title: "Zapier Blog",
    url: "https://zapier.com/blog/feeds/latest/",
    siteUrl: "https://zapier.com/blog/",
    notes: "Automation, workflow design, productivity, and app integrations.",
    tags: ["automation", "productivity", "workflow", "no-code"]
  },
  {
    id: "morningstar",
    title: "Morningstar",
    url: "https://www.morningstar.com/rss",
    siteUrl: "https://www.morningstar.com/",
    notes: "Funds, portfolio management, investing education, and market analysis.",
    tags: ["investing", "etf", "portfolio", "markets", "risk"]
  },
  {
    id: "advisor-perspectives",
    title: "Advisor Perspectives",
    url: "https://www.advisorperspectives.com/commentaries.xml",
    siteUrl: "https://www.advisorperspectives.com/",
    notes: "Portfolio strategy, risk management, markets, and advisor commentary.",
    tags: ["investing", "portfolio", "risk", "markets", "etf"]
  },
  {
    id: "bitcoin-optech",
    title: "Bitcoin Optech",
    url: "https://bitcoinops.org/feed.xml",
    siteUrl: "https://bitcoinops.org/",
    notes: "Bitcoin protocol, wallets, scaling, and developer operations.",
    tags: ["bitcoin", "crypto", "developer-tools", "security"]
  },
  {
    id: "bankless",
    title: "Bankless",
    url: "https://www.bankless.com/feed",
    siteUrl: "https://www.bankless.com/",
    notes: "Crypto markets, Ethereum, DeFi, and digital asset analysis.",
    tags: ["crypto", "ethereum", "defi", "markets", "investing"]
  },
  {
    id: "security-weekly",
    title: "Security Weekly",
    url: "https://securityweekly.com/feed/",
    siteUrl: "https://securityweekly.com/",
    notes: "Security news, application security, cloud security, and operations.",
    tags: ["security", "cloud", "devops", "developer-tools"]
  },
  {
    id: "krebs",
    title: "Krebs on Security",
    url: "https://krebsonsecurity.com/feed/",
    siteUrl: "https://krebsonsecurity.com/",
    notes: "Security investigations, fraud, breaches, and threat reporting.",
    tags: ["security", "privacy", "risk"]
  },
  {
    id: "cloudflare-blog",
    title: "Cloudflare Blog",
    url: "https://blog.cloudflare.com/rss/",
    siteUrl: "https://blog.cloudflare.com/",
    notes: "Networking, security, performance, infrastructure, and edge computing.",
    tags: ["cloud", "security", "networking", "performance", "infrastructure"]
  },
  {
    id: "aws-news",
    title: "AWS News Blog",
    url: "https://aws.amazon.com/blogs/aws/feed/",
    siteUrl: "https://aws.amazon.com/blogs/aws/",
    notes: "AWS launches, cloud architecture, serverless, and infrastructure updates.",
    tags: ["cloud", "aws", "serverless", "devops", "infrastructure"]
  },
  {
    id: "docker-blog",
    title: "Docker Blog",
    url: "https://www.docker.com/blog/feed/",
    siteUrl: "https://www.docker.com/blog/",
    notes: "Containers, developer workflows, deployments, and platform tooling.",
    tags: ["devops", "containers", "docker", "developer-tools", "cloud"]
  },
  {
    id: "kubernetes-blog",
    title: "Kubernetes Blog",
    url: "https://kubernetes.io/feed.xml",
    siteUrl: "https://kubernetes.io/blog/",
    notes: "Kubernetes releases, operations, cloud native patterns, and community updates.",
    tags: ["kubernetes", "devops", "cloud", "containers", "infrastructure"]
  }
];

export function searchFeedCatalog(query = "", limit = 12) {
  const installedFeeds = getInstalledFeedMap();
  const terms = normalizeTerms(query);
  const resultLimit = normalizeLimit(limit);

  return FEED_CATALOG.map((feed) => {
    const haystack = `${feed.title} ${feed.notes} ${feed.siteUrl} ${feed.tags.join(" ")}`.toLowerCase();
    const score = terms.length
      ? terms.reduce((sum, term) => sum + scoreTerm(feed, haystack, term), 0)
      : 1;

    return {
      ...feed,
      score,
      ...installedState(feed.url, installedFeeds)
    };
  })
    .filter((feed) => feed.score > 0)
    .sort((a, b) => Number(a.added) - Number(b.added) || b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, resultLimit)
    .map(({ score, ...feed }) => feed);
}

export async function discoverFeeds(query = "", limit = 12) {
  const url = parseDiscoverUrl(query);
  const resultLimit = normalizeLimit(limit);
  const searchQuery = url ? catalogQueryFromUrl(url) : query;
  const catalogResults = searchFeedCatalog(searchQuery, resultLimit);
  const directoryResults = await searchFeedDirectory(searchQuery, resultLimit);

  if (!url) {
    return mergeSuggestions(catalogResults, directoryResults).slice(0, resultLimit);
  }

  try {
    const discovered = await discoverFromWebsite(url);
    const installedFeeds = getInstalledFeedMap();
    const normalizedDiscovered = discovered.map((feed) => ({
      ...feed,
      ...installedState(feed.url, installedFeeds),
      tags: ["discovered", "rss", "website"]
    }));

    return mergeSuggestions(normalizedDiscovered, catalogResults, directoryResults).slice(0, resultLimit);
  } catch {
    return mergeSuggestions(catalogResults, directoryResults).slice(0, resultLimit);
  }
}

function normalizeLimit(limit) {
  const parsed = Number.parseInt(limit, 10);
  if (!Number.isFinite(parsed)) return 12;
  return Math.min(Math.max(parsed, 1), 30);
}

export function listCatalogTags() {
  const counts = new Map();
  for (const feed of FEED_CATALOG) {
    for (const tag of feed.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

function normalizeTerms(query) {
  return String(query)
    .toLowerCase()
    .split(/[^a-z0-9+#.-]+/)
    .map((term) => term.trim())
    .filter(Boolean);
}

function scoreTerm(feed, haystack, term) {
  let score = 0;
  if (feed.tags.includes(term)) score += 8;
  if (feed.title.toLowerCase().includes(term)) score += 5;
  if (haystack.includes(term)) score += 2;

  const relatedTags = {
    ai: ["llm", "machine-learning", "automation", "inference"],
    llm: ["ai", "machine-learning", "automation"],
    ml: ["machine-learning", "ai", "data"],
    mobile: ["react", "frontend", "javascript"],
    app: ["product", "frontend", "developer-tools"],
    finance: ["investing", "markets", "portfolio", "risk"],
    trading: ["markets", "risk", "crypto"],
    wordpress: ["publishing", "web", "seo"],
    nonprofit: ["fundraising", "publishing", "strategy"],
    a11y: ["accessibility", "web", "design"],
    design: ["ux", "product", "frontend"],
    backend: ["node", "python", "database", "devops"],
    ops: ["devops", "cloud", "automation", "security"]
  };

  for (const related of relatedTags[term] || []) {
    if (feed.tags.includes(related)) score += 3;
  }

  return score;
}

function parseDiscoverUrl(query) {
  const value = String(query || "").trim();
  if (!value || /\s/.test(value)) return null;

  const hasProtocol = /^https?:\/\//i.test(value);
  if (!hasProtocol && !value.includes(".")) return null;

  const candidate = hasProtocol ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol) || isBlockedHost(url.hostname)) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

async function searchFeedDirectory(query, limit) {
  const terms = normalizeTerms(query)
    .filter((term) => term.length > 1 && !["http", "https", "www"].includes(term))
    .slice(0, 6);

  if (terms.length === 0) return [];

  try {
    const url = new URL("https://cloud.feedly.com/v3/search/feeds");
    url.searchParams.set("query", terms.join(" "));
    url.searchParams.set("count", String(Math.min(normalizeLimit(limit), 20)));

    const data = await fetchJson(url);
    const installedFeeds = getInstalledFeedMap();

    return (data.results || [])
      .map((result) => mapDirectoryResult(result, installedFeeds, terms))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function mapDirectoryResult(result, installedFeeds, terms) {
  const feedUrl = directoryFeedUrl(result);
  if (!feedUrl) return null;

  try {
    const parsedFeedUrl = new URL(feedUrl);
    if (!["http:", "https:"].includes(parsedFeedUrl.protocol) || isBlockedHost(parsedFeedUrl.hostname)) {
      return null;
    }
  } catch {
    return null;
  }

  if (!directoryResultMatches(result, feedUrl, terms)) {
    return null;
  }

  const topicTags = (result.topics || [])
    .map((topic) => slugify(topic))
    .filter(Boolean);
  const tags = [...new Set([...topicTags, ...terms.slice(0, 3), "directory"])];
  const subscriberText = Number.isFinite(Number(result.subscribers))
    ? ` ${Number(result.subscribers).toLocaleString()} Feedly subscribers.`
    : "";

  return {
    id: `directory-${slugify(feedUrl)}`,
    title: result.title || new URL(feedUrl).hostname,
    url: feedUrl,
    siteUrl: result.website || new URL(feedUrl).origin,
    notes: `${result.description || "Found in Feedly's public feed directory."}${subscriberText}`.trim(),
    tags,
    ...installedState(feedUrl, installedFeeds)
  };
}

function directoryFeedUrl(result) {
  const id = result.feedId || result.id || "";
  const fromId = id.startsWith("feed/") ? id.slice(5) : "";
  return result.feedUrl || result.url || fromId;
}

function directoryResultMatches(result, feedUrl, terms) {
  const haystack = `${result.title || ""} ${result.description || ""} ${(result.topics || []).join(" ")} ${feedUrl} ${result.website || ""}`.toLowerCase();

  return terms.some((term) => new RegExp(`(^|[^a-z0-9])${escapeRegex(term)}([^a-z0-9]|$)`, "i").test(haystack));
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function catalogQueryFromUrl(url) {
  const host = url.hostname.replace(/^www\./, "");
  const hostTerms = host
    .split(/[.-]+/)
    .filter((term) => term.length > 2 && term !== "com" && term !== "org" && term !== "net" && term !== "dev")
    .join(" ");

  return `${host} ${hostTerms}`.trim();
}

async function discoverFromWebsite(url) {
  const html = await fetchText(url);
  const candidates = new Map();

  for (const link of findAlternateFeedLinks(html, url)) {
    candidates.set(link.url, link);
  }

  for (const path of ["/feed", "/feed/", "/rss", "/rss.xml", "/atom.xml", "/feed.xml", "/index.xml"]) {
    const candidate = new URL(path, url.origin);
    candidates.set(candidate.toString(), {
      title: `${url.hostname} ${path.replaceAll("/", " ").trim() || "feed"}`.trim(),
      url: candidate.toString(),
      siteUrl: url.origin,
      notes: `Discovered from common RSS path ${path}.`
    });
  }

  const verified = [];
  for (const candidate of candidates.values()) {
    if (verified.length >= 8) break;
    if (await looksLikeFeed(candidate.url)) {
      verified.push({
        id: `discovered-${slugify(candidate.title || candidate.url)}`,
        title: candidate.title || new URL(candidate.url).hostname,
        url: candidate.url,
        siteUrl: candidate.siteUrl || url.origin,
        notes: candidate.notes || `Discovered from ${url.hostname}.`
      });
    }
  }

  return verified;
}

function findAlternateFeedLinks(html, baseUrl) {
  const links = [];
  const linkPattern = /<link\b[^>]*>/gi;
  const attributePattern = /([a-zA-Z_:.-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+)/g;

  for (const [tag] of html.matchAll(linkPattern)) {
    const attrs = {};
    for (const [, name, rawValue] of tag.matchAll(attributePattern)) {
      attrs[name.toLowerCase()] = rawValue.replace(/^['"]|['"]$/g, "");
    }

    const type = attrs.type?.toLowerCase() || "";
    const rel = attrs.rel?.toLowerCase() || "";
    if (!attrs.href || !rel.includes("alternate") || !/(rss|atom|xml)/.test(type)) continue;

    try {
      const url = new URL(attrs.href, baseUrl).toString();
      links.push({
        title: attrs.title || new URL(url).hostname,
        url,
        siteUrl: new URL(baseUrl).origin,
        notes: "Discovered from the site's alternate feed link."
      });
    } catch {}
  }

  return links;
}

async function looksLikeFeed(url) {
  try {
    const text = await fetchText(new URL(url), 160000);
    return /<(rss|feed|rdf:RDF)\b/i.test(text);
  } catch {
    return false;
  }
}

async function fetchText(url, maxLength = 400000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json, application/rss+xml, application/atom+xml, application/xml, text/xml, text/html, */*",
        "User-Agent": "LearningRSSDashboard/0.1"
      },
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    return text.slice(0, maxLength);
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url, 250000));
}

function mergeSuggestions(...groups) {
  const seen = new Set();
  const merged = [];

  for (const feed of groups.flat()) {
    const key = feed.url.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(feed);
  }

  return merged;
}

function getInstalledFeedMap() {
  return new Map(listFeeds().map((feed) => [feed.url.toLowerCase(), feed]));
}

function installedState(url, installedFeeds) {
  const feed = installedFeeds.get(String(url).toLowerCase());

  return {
    added: Boolean(feed),
    addedFeedId: feed?.id || "",
    addedCategoryId: feed?.category_id || "",
    addedCategoryName: feed?.category_name || "",
    addedFeedTitle: feed?.title || ""
  };
}

function isBlockedHost(hostname) {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "0.0.0.0" ||
    host.startsWith("127.") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
    host === "::1" ||
    host === "[::1]"
  );
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "feed";
}
