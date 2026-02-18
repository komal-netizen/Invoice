# Backend Plan for Invoice Platform

## Should you create a separate project for the backend?

**Recommendation: Keep the backend in this same project.**

| Approach | Pros | Cons |
|----------|------|------|
| **Same project (recommended)** | One repo, one deploy, shared TypeScript types, no CORS. Next.js API routes + a database. | Frontend and backend ship together. |
| **Separate backend project** | Clear separation; different team can own it; same API can serve mobile app later. | Two repos, two deploys, CORS, duplicate or synced types. |

Use a **separate backend project** only if you need:
- A different team to own the API
- The same API to power a mobile app or other clients
- To scale or rewrite the backend independently

For most small/medium apps, **one Next.js project + database** is simpler and easier to maintain.

---

## What “all the backend” means

1. **Database** – Persist clients, projects, boards, tasks, invoices, settings (replace Zustand + localStorage and in-memory `invoice-store`).
2. **API layer** – REST or tRPC in this repo (e.g. `src/app/api/` or `src/server/`).
3. **Auth** – If you need multi-user: login/signup, sessions or JWT, and row-level security.
4. **Existing APIs** – Your current routes (Slack, Stripe, Resend, cron, onboarding, client board) stay; they’ll read/write from the database instead of in-memory/store.

---

## Git

- **Same project:** One repo. Backend lives in this repo (e.g. `src/app/api/`, `prisma/`). No extra repo.
- **Separate backend:** Create a second repo for the backend and add it to Git like any other project. Frontend repo would call the backend’s API URL (env var).

---

## Suggested stack (in this project)

- **ORM:** Prisma  
- **Database:** PostgreSQL (e.g. Vercel Postgres, Supabase, or Railway) or SQLite for local/dev  
- **API:** Next.js Route Handlers in `src/app/api/` (you already use these)  
- **Auth (optional):** NextAuth.js or similar, when you need multi-user  

---

## What’s included in this repo

- **Prisma** – `prisma/schema.prisma` with Client, Project, Board, BoardList, BoardTask, Invoice, AppSettings.
- **DB client** – `src/lib/db.ts` (use only in API routes or server code).
- **API routes** – 
  - `GET /api/data/health` – backend health check (returns `{ ok, db }`).
  - `GET/POST /api/data/clients` – list and create clients.
  - `GET/POST /api/data/boards` – list and create boards (with lists).

---

## Setup (one project, one repo)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set database URL**  
   - Next.js reads `.env.local` at runtime. Add there: `DATABASE_URL="file:./prisma/dev.db"`.
   - Prisma CLI (e.g. `db push`, `migrate`) reads `.env` in the project root. Create `.env` with the same line, or run commands as: `DATABASE_URL="file:./prisma/dev.db" npx prisma db push`.
   For production, use a PostgreSQL URL (e.g. Vercel Postgres, Supabase, Railway).

3. **Create the database and generate the client**
   ```bash
   npx prisma generate
   npx prisma db push
   ```
   `db push` creates tables from the schema (no migrations yet). For production, use `npx prisma migrate dev` and then `prisma migrate deploy`.

4. **Run the app**
   ```bash
   npm run dev
   ```
   - Open `http://localhost:3000/api/data/health` – should return `{ "ok": true, "db": "connected" }`.
   - Use `GET/POST /api/data/clients` and `GET/POST /api/data/boards` to test.

5. **Git**  
   This is still **one repo**. Commit the backend as part of this project:
   - Commit: `prisma/schema.prisma`, `src/lib/db.ts`, `src/app/api/data/`, `package.json`, `.env.local.example`.
   - Do **not** commit `.env.local` or `prisma/*.db` (they are in `.gitignore`).

---

## Next steps (optional)

- Add more API routes for projects, board lists, board tasks, invoices, and settings.
- Switch the frontend from Zustand persist to fetching/posting to these APIs.
- Add auth (e.g. NextAuth.js) when you need multi-user.
- For a **separate backend repo**: create a new project, move API + Prisma there, and point this app’s `NEXT_PUBLIC_API_URL` at the new backend.
