# CommonGround Cards

CommonGround Cards is now a lightweight full-stack app built with Next.js, Prisma, and SQLite. It keeps the TinyFish-powered card and group insights flows, adds real persistence, and introduces a left-side history column with saved previous issues.

## Architecture

- Next.js App Router for the full-stack app shell and API routes
- Prisma ORM with a local SQLite database for persistent card history
- React client UI for the 4-panel desktop layout
- TinyFish-backed server utilities for card generation and group insights, with fallback behavior preserved

## Features

- Generate a structured civic card from `issue + opinion`
- Persist every generated card to SQLite
- Browse the most recent 20 history items in a dedicated left-side column
- Search history, reload a previous card, remove one item, or clear all history
- Add the active card to a group and generate shared-value insights
- Keep the Governance and Collaboration framing, ASU-inspired theme, and recommended solution flow

## Database Schema

The Prisma model lives in `prisma/schema.prisma`.

Stored fields:

- `id`
- `issue`
- `originalOpinion`
- `concern`
- `underlyingValue`
- `whoIsAffected`
- `commonGround`
- `constructiveNextStep`
- `valueTags`
- `evidence`
- `ethicalNotes`
- `source`
- `runMeta`
- `fallbackReason`
- `createdAt`

## Environment Variables

Create `.env` from `.env.example`:

```bash
PORT=3000
DATABASE_URL="file:dev.db"
TINYFISH_API_KEY=
TINYFISH_BASE_URL="https://agent.tinyfish.ai"
```

Notes:

- `TINYFISH_API_KEY` is optional. If it is missing, the app still works in fallback mode.
- `DATABASE_URL` points Prisma to the local SQLite file.

## Local Setup

Install dependencies:

```bash
npm install
```

Create the SQLite database and Prisma client:

```bash
npm run db:generate
npm run db:push
```

Start the local dev server:

```bash
npm run dev
```

Then open `http://localhost:3000`.

For a production-style local run:

```bash
npm run build
npm start
```

## API Routes

- `POST /api/card` generates a card and saves it to history
- `POST /api/insights` generates group insights
- `GET /api/history` returns the newest history items first
- `GET /api/history/:id` returns a single history item
- `DELETE /api/history/:id` removes one history item
- `DELETE /api/history` clears all history
- `GET /api/health` reports TinyFish status

## How The History Column Works

- Every successful card generation is persisted immediately through Prisma.
- The history list is ordered by `createdAt DESC`, so the newest cards appear first.
- The UI loads the active history item into the Card Output panel when clicked.
- Clicking a history item also restores its issue and original opinion into the Input panel.
- The active history item is visually highlighted.
- The list is capped to the most recent 20 items in the UI and API, while the database can store more.
