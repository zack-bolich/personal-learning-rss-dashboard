import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { upsertCategory, upsertFeed, db, getDbPath } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(__dirname, "feeds.seed.json");
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

export function seedFeeds() {
  const seed = JSON.parse(readFileSync(seedPath, "utf8"));

  db.exec("BEGIN");
  try {
    for (const category of seed.categories) {
      upsertCategory(category);
      for (const feed of category.feeds || []) {
        upsertFeed(feed, category.id);
      }
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  const feedCount = seed.categories.reduce((sum, category) => sum + (category.feeds || []).length, 0);
  return { categories: seed.categories.length, feeds: feedCount, dbPath: getDbPath() };
}

if (isDirectRun) {
  const result = seedFeeds();
  console.log(`Seeded ${result.categories} categories and ${result.feeds} feeds.`);
  console.log(`SQLite database: ${result.dbPath}`);
}
