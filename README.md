# Learning RSS Dashboard

A local-first web app that collects RSS feeds into user-defined learning categories, stores articles in SQLite, and builds a small daily queue across your interests.

## What It Includes

- React dashboard with category, source, status, tag, and keyword filters.
- UI forms for adding custom interest categories and RSS feeds.
- Feed discovery by interest/tag, Feedly directory search, plus website URL discovery for RSS/Atom links.
- Express API with scheduled RSS fetching.
- SQLite database stored locally at `data/learning-rss.sqlite`.
- Public-safe starter feeds in `server/feeds.seed.json`.
- Article actions for read, saved, and important.
- Automatic tags from keyword matching.
- A "Today's Learning Queue" that prefers unread, high-signal articles from different categories.

## Requirements

- Node.js 24 or newer.
- Internet access when fetching feeds.

This app uses Node 24's built-in `node:sqlite` module, so it does not need `better-sqlite3` or other native SQLite packages.

## Install

From this folder:

```powershell
npm.cmd install
```

PowerShell may block `npm.ps1` on some Windows machines, so `npm.cmd` is the reliable command.

## Run In Development

```powershell
npm.cmd run dev
```

Open:

```text
http://127.0.0.1:5173
```

The dev script starts:

- API server: `http://127.0.0.1:3001`
- React app: `http://127.0.0.1:5173`

The API seeds the feed list automatically on startup and fetches feeds every 30 minutes. Use the dashboard's "Fetch now" button, or set `FETCH_ON_START=true`, if you want an immediate refresh when the server starts.

## Useful Commands

```powershell
npm.cmd run seed
npm.cmd run fetch
npm.cmd run check
npm.cmd run build
```

After `npm.cmd run build`, one server can run both the API and built dashboard:

```powershell
npm.cmd run start
```

Open:

```text
http://127.0.0.1:3001
```

To start the built server in the background:

```powershell
npm.cmd run serve:background
```

## Add Categories And Feeds

Use the sidebar forms to add a new interest category or attach an RSS feed to a category. These changes are stored in your local SQLite database.

The Discover feeds box accepts either an interest/tag, such as `react`, `seo`, `investing`, or `knitting`, or a website URL/domain. Interest searches first check the local starter catalog, then use Feedly's public feed directory to find broader RSS sources. For website URLs, the app looks for RSS/Atom `<link rel="alternate">` tags and common feed paths such as `/feed`, `/rss.xml`, and `/atom.xml`.

The starter feed list is also editable:

```text
server/feeds.seed.json
```

Add a feed inside the best category:

```json
{
  "id": "example-feed",
  "title": "Example Feed",
  "url": "https://example.com/feed.xml",
  "siteUrl": "https://example.com/",
  "notes": "Why this feed belongs here.",
  "priority": true
}
```

Use `priority: true` for feeds that should receive a small ranking boost in the learning queue. After editing, run:

```powershell
npm.cmd run seed
npm.cmd run fetch
```

## Database Schema

The schema lives in:

```text
server/schema.sql
```

Main tables:

- `categories`: learning buckets and user-created interest categories.
- `feeds`: RSS feed subscriptions and fetch status.
- `articles`: local article cache with read, saved, important, score, and future `ai_summary` fields.
- `article_tags`: many-to-many article tags generated from keywords.

## API

- `GET /api/meta`: categories, feeds, tags, and counts.
- `GET /api/articles`: filterable article list.
- `GET /api/learning-queue?limit=8`: daily learning picks.
- `GET /api/feed-suggestions?query=react`: suggested feeds by interest/tag or website URL.
- `POST /api/categories`: add a category with `name`, `description`, and `color`.
- `PATCH /api/categories/:id`: update a category.
- `DELETE /api/categories/:id`: delete a category and its feeds/articles.
- `POST /api/feeds`: add a feed with `categoryId`, `title`, `url`, optional `siteUrl`, and optional `priority`.
- `POST /api/fetch`: fetch all active feeds now.
- `PATCH /api/articles/:id`: update `isRead`, `isSaved`, or `isImportant`.

Example:

```powershell
Invoke-RestMethod http://127.0.0.1:3001/api/articles
```

## Public Sharing Notes

This repository intentionally ignores local data and generated files:

- `data/*.sqlite`
- `node_modules/`
- `dist/`
- `*.log`
- `.env`

The starter feeds are generic and public-safe. Any private categories, feeds, saved articles, or read state live only in the local SQLite database.

## Later Additions

The project is intentionally small, but the schema and API leave room for:

- AI summaries stored in `articles.ai_summary`.
- Email digests generated from saved or important articles.
- OPML export/import for Inoreader, Feedly, NewsBlur, or other readers.
- A React Native / Expo mobile client using the same API.
- Smarter learning-queue ranking with embeddings or local LLM scoring.
