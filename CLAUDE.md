# CLAUDE.md

Notes for future Claude sessions working on this repo.

## What this is

A personal time-tracking web app. Users log in with Discord, create activity tags (Work, Studying, ...), then start/stop a timer for each session. Sessions store user, tag, start time, end time, duration, and a description.

## Stack and why

- **Vite + React + TS + Tailwind + Framer Motion** — fast dev loop, animation library was a hard requirement.
- **Express + Prisma + TS** — simple, well-known. Prisma gives type-safe queries + migrations.
- **PostgreSQL** — required by the project brief.
- **Discord OAuth2** — only auth method. Session is a signed JWT in an `HttpOnly` cookie (no Redis needed in dev).
- **Docker Compose** — three services, dev only. No production images yet.

## Where things live

```
frontend/src/
  api/client.ts          fetch wrapper, sends cookies; throws ApiError on non-2xx
  types.ts               shared Tag, TrackingSession types
  auth/                  AuthContext (loads /auth/me), LoginPage
  components/            Sidebar, TagDropdown, TimerButton, ElapsedDisplay, NewTagModal, DescriptionForm
  pages/TrackerPage.tsx  main UI; owns timer state + calls /sessions/* directly
  hooks/                 useTags (CRUD), useElapsed (tick interval, format HH:MM:SS)

backend/src/
  env.ts                 zod-validated env loader (READ ENV ONLY HERE)
  prisma.ts              PrismaClient singleton
  auth/discord.ts        OAuth helpers
  auth/session.ts        JWT sign/verify + cookie set/clear
  auth/middleware.ts     requireAuth → attaches req.user
  routes/auth.routes.ts  /auth/discord, /callback, /me, /logout
  routes/tags.routes.ts  GET, POST, DELETE
  routes/sessions.routes.ts  /sessions/active, /start, /:id/stop, PATCH /:id, GET /
  server.ts              express bootstrap, mounts routers, CORS

backend/prisma/schema.prisma   data model
```

## How to run

`cp .env.example .env`, fill Discord credentials and `SESSION_SECRET`, then `docker compose up --build`. App at <http://localhost:5173>.

## Schema sync: `db push` vs migrations

The compose `backend` command runs `npx prisma db push` on startup, not `migrate deploy`. Reason: the repo currently ships without any committed migration files, and `migrate deploy` would fail on first boot. `db push` is non-interactive and just syncs `schema.prisma` → DB.

When you want versioned migration history:
1. `docker compose exec backend npx prisma migrate dev --name init` — generates the first migration under `backend/prisma/migrations/` and commit it.
2. Switch the compose command from `db push --skip-generate --accept-data-loss` to `migrate deploy`.
3. From then on, every schema change = a new `migrate dev` invocation that produces a committed migration file.

Don't mix the two long-term — `db push` ignores the `_prisma_migrations` table and can drift from migration history.

## DB invariants

- **One active session per user**: at most one `TrackingSession` row per user where `endedAt IS NULL`. Enforced by checking before insert in `POST /sessions/start`.
- **Tags are per-user**: every `Tag` is owned by a `User`. Listed and created scoped to `req.user.id`.
- **Tag names unique per user** (`@@unique([userId, name])`).

## Conventions

- Use zod schemas at the top of each route file to validate request bodies.
- `PrismaClient` is a module-level singleton (`backend/src/prisma.ts`) — never `new PrismaClient()` elsewhere.
- All secrets are read from `env.ts` (zod-validated). Don't reach into `process.env` anywhere else.
- Never log tokens, secrets, or `req.body` blindly.
- Public repo — anything outside `.env` may be read by anyone.

## Mini-checklists

**Adding a new endpoint**
1. Add zod schema for the body (if any) at the top of the route file.
2. Wrap the handler with `requireAuth` if it needs the user.
3. Always scope DB reads/writes by `req.user.id`.
4. Return JSON, never the Prisma error object directly.

**Adding a new component**
1. Put it under `frontend/src/components/` unless it's a route (then `pages/`).
2. Use Tailwind for styling, Framer Motion (`motion.div`) for animation.
3. Pull data via the `useXxx` hooks under `frontend/src/hooks/`, not directly in components.

**Changing the schema**
1. Edit `backend/prisma/schema.prisma`.
2. `docker compose exec backend npx prisma migrate dev --name <change>`.
3. Commit the new file under `backend/prisma/migrations/`.
