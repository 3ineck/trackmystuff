# Tempore

A personal productivity web app: time tracking, calendar, todos, notes, and planning in one place. Log in with Discord, then:

- Start/pause/stop tagged timers to track how you spend your time.
- Add calendar events (with recurrence) and mark occurrences complete.
- Keep a todo list with due dates, favorites, and an archive.
- Jot down quick notes.
- Group plan items into plan groups with optional date ranges.
- Opt in to a Discord bot that posts a daily summary of today's events, timed todos, and dated plan items — and exposes slash commands for the same.

Everything is saved to PostgreSQL.

## Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Node + TypeScript + Express + Prisma
- **Bot**: Node + TypeScript + discord.js (slash commands + daily notification cron)
- **Database**: PostgreSQL 16
- **Auth**: Discord OAuth2
- **Local dev**: Docker Compose (four services: `db`, `backend`, `frontend`, `bot`)

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose v2)
- A Discord application (free) — see the next section

## Discord OAuth setup (one-time, ~2 minutes)

1. Go to <https://discord.com/developers/applications> and click **New Application**.
2. In the sidebar open **OAuth2**.
3. Under **Redirects** add: `http://localhost:4000/auth/callback`
4. Copy the **Client ID** and **Client Secret**.
5. You'll paste these into `.env` in the next step.

## Quick start

```bash
git clone <this-repo>
cd tempore
cp .env.example .env
# Open .env and fill in DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, and a strong SESSION_SECRET
docker compose up --build
```

Then open <http://localhost:5173>.

## Project structure

```
tempore/
├── docker-compose.yml
├── .env.example
├── frontend/    Vite + React + Tailwind + Framer Motion
├── backend/     Express + Prisma, /auth /tags /sessions /todos /events /notes /planGroups /planItems /notifications /bot
└── bot/         discord.js slash-command bot + daily notification cron
```

## Common commands

```bash
# Tail logs for a service
docker compose logs -f backend

# Open Prisma Studio (GUI for the DB) at http://localhost:5555
docker compose exec backend npx prisma studio

# Create a new migration after editing prisma/schema.prisma
docker compose exec backend npx prisma migrate dev --name <change-description>

# Reset everything (DROPS THE DATABASE)
docker compose down -v
```

## License

MIT
