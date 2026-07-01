# Personal Learning RSS Dashboard

A local web app that collects RSS feeds into learning categories, stores articles in SQLite, and gives you a small daily queue across your current interests and projects.

## What It Includes

- React dashboard with category, source, status, tag, and keyword filters.
- Express API with scheduled RSS fetching.
- SQLite database stored locally at `data/learning-rss.sqlite`.
- Starter feeds in `server/feeds.seed.json`.
- Article actions for read, saved, and important.
- Automatic tags from keyword matching.
- A "Today’s Learning Queue" that prefers unread, high-signal, project-relevant articles from different categories.

The seed list reflects the workspace projects found next to this app: Rustchain, BeaconAtlas, crypto MCP work, Tent of Trials, and Love Thy Neighbor WordPress/nonprofit work.

## Requirements

- Node.js 24 or newer.
- Internet access when fetching feeds.

This app uses Node 24's built-in `node:sqlite` module, so it does not need `better-sqlite3` or other native SQLite packages.

## Install

From this folder:

```powershell
npm.cmd install
```

PowerShell may block `npm.ps1` on this machine, so `npm.cmd` is the reliable command.

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

`npm.cmd run fetch` is useful after editing the seed list.

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

## Edit Or Add Feeds

Edit:

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
  "projectInterest": true
}
```

Use `projectInterest: true` for feeds that directly support current projects. After editing, run:

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

- `categories`: learning buckets such as Software Development or AI and Automation.
- `feeds`: RSS feed subscriptions and fetch status.
- `articles`: local article cache with read, saved, important, score, and future `ai_summary` fields.
- `article_tags`: many-to-many article tags generated from keywords.

## API

- `GET /api/meta`: categories, feeds, tags, and counts.
- `GET /api/articles`: filterable article list.
- `GET /api/learning-queue?limit=8`: daily learning picks.
- `POST /api/fetch`: fetch all active feeds now.
- `PATCH /api/articles/:id`: update `isRead`, `isSaved`, or `isImportant`.

Example:

```powershell
Invoke-RestMethod http://127.0.0.1:3001/api/articles
```

## Later Additions

The project is intentionally small, but the schema and API leave room for:

- AI summaries stored in `articles.ai_summary`.
- Email digests generated from saved or important articles.
- OPML export/import for Inoreader, Feedly, NewsBlur, or other readers.
- A React Native / Expo mobile client using the same API.
- Smarter learning-queue ranking with embeddings or local LLM scoring.
