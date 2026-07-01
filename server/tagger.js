const TAG_KEYWORDS = [
  ["python", ["python", "django", "pip", "pytest", "asyncio"]],
  ["javascript", ["javascript", "typescript", "node.js", "nodejs", "npm", "express"]],
  ["react", ["react", "jsx", "hooks", "server components"]],
  ["react-native", ["react native", "expo", "mobile app", "ios", "android"]],
  ["database", ["sqlite", "mongodb", "postgres", "database", "schema"]],
  ["github-codex", ["github", "pull request", "actions", "copilot", "codex", "code review"]],
  ["agentic-ai", ["agent", "agents", "agentic", "tool use", "mcp", "multi-agent"]],
  ["local-llm", ["local llm", "ollama", "llama", "quantization", "gguf", "inference"]],
  ["comfyui", ["comfyui", "stable diffusion", "workflow", "image generation"]],
  ["runpod", ["runpod", "gpu", "cuda", "serverless"]],
  ["tts", ["text-to-speech", "tts", "voice", "speech synthesis"]],
  ["wordpress", ["wordpress", "gutenberg", "block editor", "kadence", "wp-admin"]],
  ["accessibility", ["accessibility", "a11y", "wcag", "screen reader", "alt text"]],
  ["seo", ["seo", "search console", "structured data", "ranking", "schema markup"]],
  ["nonprofit", ["nonprofit", "donation", "fundraising", "volunteer", "qr code"]],
  ["etf", ["etf", "index fund", "fund flows"]],
  ["trading", ["swing trading", "technical analysis", "breakout", "setup", "stop loss"]],
  ["risk", ["risk management", "position sizing", "drawdown", "volatility", "portfolio"]],
  ["crypto", ["crypto", "bitcoin", "ethereum", "coinbase", "robinhood", "solana"]],
  ["catholic", ["catholic", "vatican", "pope", "saint", "mass", "eucharist"]],
  ["scripture", ["scripture", "gospel", "psalm", "readings", "bible"]],
  ["recovery", ["recovery", "aa", "twelve step", "sobriety", "codependency"]],
  ["spiritual-discipline", ["prayer", "discipline", "discernment", "virtue", "habit"]]
];

const PROJECT_KEYWORDS = [
  "rustchain",
  "depin",
  "hardware",
  "mining",
  "wallet",
  "beacon",
  "mcp",
  "trading",
  "risk",
  "wordpress",
  "nonprofit",
  "accessibility",
  "agent"
];

export function cleanText(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function tagArticle(article, feed) {
  const haystack = `${article.title} ${article.summary} ${article.content} ${feed.title} ${feed.notes}`.toLowerCase();
  const tags = new Set();

  for (const [tag, keywords] of TAG_KEYWORDS) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      tags.add(tag);
    }
  }

  if (feed.project_interest) {
    tags.add("project-interest");
  }

  if (PROJECT_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    tags.add("workspace-relevant");
  }

  return [...tags].sort();
}

export function scoreArticle(article, feed, tags) {
  let score = 20;
  const text = `${article.title} ${article.summary}`.toLowerCase();

  // These weights make the learning queue prefer practical, build-useful articles.
  if (feed.project_interest) score += 20;
  if (tags.includes("workspace-relevant")) score += 15;
  if (tags.includes("github-codex") || tags.includes("agentic-ai")) score += 10;
  if (tags.includes("risk") || tags.includes("accessibility")) score += 8;
  if (/\b(tutorial|guide|how to|release|deep dive|case study|checklist)\b/.test(text)) score += 10;
  if (/\b(sponsored|webinar|sale|coupon)\b/.test(text)) score -= 8;

  return Math.max(0, score);
}
