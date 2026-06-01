# TrackMyStuff

A web app to track how you spend your time. Log in with Discord, pick an activity tag (Work, Studying, Side project, ...), hit START, hit STOP, add a description. Everything is saved to PostgreSQL so you can review your sessions later.

## Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Node + TypeScript + Express + Prisma
- **Database**: PostgreSQL 16
- **Auth**: Discord OAuth2
- **Local dev**: Docker Compose (three services: `db`, `backend`, `frontend`)

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
cd trackmystuff
cp .env.example .env
# Open .env and fill in DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, and a strong SESSION_SECRET
docker compose up --build
```

Then open <http://localhost:5173>.

## Project structure

```
trackmystuff/
├── docker-compose.yml
├── .env.example
├── frontend/    Vite + React + Tailwind + Framer Motion
└── backend/     Express + Prisma, /auth /tags /sessions
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
