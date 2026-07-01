import express from "express";
import cron from "node-cron";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchAllFeeds } from "./fetchFeeds.js";
import { getDashboardMeta, getLearningQueue, listArticles, updateArticleStatus } from "./db.js";
import { seedFeeds } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const app = express();
const port = Number(process.env.PORT || 3001);
const isProduction = process.env.NODE_ENV === "production";
const distDir = path.join(rootDir, "dist");
const shouldServeStatic =
  process.env.SERVE_STATIC !== "false" &&
  (isProduction || existsSync(path.join(distDir, "index.html")));

app.use(express.json());

const seedResult = seedFeeds();
console.log(`RSS dashboard using ${seedResult.dbPath}`);

let fetchInProgress = false;
let lastFetchSummary = null;

async function runFetch() {
  if (fetchInProgress) {
    return { skipped: true, message: "A feed fetch is already running." };
  }

  fetchInProgress = true;
  try {
    const results = await fetchAllFeeds();
    lastFetchSummary = {
      fetchedAt: new Date().toISOString(),
      ok: results.filter((result) => !result.error).length,
      failed: results.filter((result) => result.error).length,
      articlesProcessed: results.reduce((sum, result) => sum + result.inserted, 0),
      results
    };
    return lastFetchSummary;
  } finally {
    fetchInProgress = false;
  }
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    fetchInProgress,
    lastFetchSummary
  });
});

app.get("/api/meta", (req, res) => {
  res.json(getDashboardMeta());
});

app.get("/api/articles", (req, res) => {
  res.json(
    listArticles({
      category: req.query.category,
      source: req.query.source,
      status: req.query.status,
      keyword: req.query.keyword,
      tag: req.query.tag,
      limit: req.query.limit,
      offset: req.query.offset
    })
  );
});

app.get("/api/learning-queue", (req, res) => {
  res.json(getLearningQueue(Number(req.query.limit) || 8));
});

app.post("/api/fetch", async (req, res, next) => {
  try {
    res.json(await runFetch());
  } catch (error) {
    next(error);
  }
});

app.patch("/api/articles/:id", (req, res) => {
  const article = updateArticleStatus(Number(req.params.id), req.body || {});
  if (!article) {
    res.status(404).json({ error: "Article not found or no supported status fields were provided." });
    return;
  }
  res.json(article);
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: error?.message || "Unexpected server error" });
});

if (shouldServeStatic) {
  app.use(express.static(distDir));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(port, "127.0.0.1", () => {
  console.log(`API server listening at http://127.0.0.1:${port}`);
});

const schedule = process.env.FETCH_CRON || "*/30 * * * *";
cron.schedule(schedule, () => {
  runFetch().catch((error) => console.error("Scheduled feed fetch failed:", error));
});

if (process.env.FETCH_ON_START === "true") {
  setTimeout(() => {
    runFetch().catch((error) => console.error("Startup feed fetch failed:", error));
  }, 1000);
}
