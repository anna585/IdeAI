# IdeAI

IdeAI is a small task manager built with Next.js, TypeScript, and SQLite. The home page is the task workspace: search, create, edit, and delete tasks without leaving the list. Create and edit open in a side panel; delete uses a confirmation dialog. Tasks have a required title and an optional description.

## Run locally

Use Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The SQLite database is created automatically at `data/ideai.sqlite` the first time a task page is opened. The `data` directory and SQLite database files are excluded from version control.

To check the production build:

```bash
npm run lint
npm run build
npm start
```

## Data and deployment

SQLite uses write-ahead logging and full synchronous writes. Keep the `data` directory on persistent local storage and back it up with the application stopped so the database remains consistent. This setup is intended for local development or a single persistent Node.js server; it is not suitable for serverless instances or multiple app servers sharing ephemeral storage.

The task list returns 30 results per page and searches titles and descriptions through the task API. JSON CRUD endpoints are available at `GET/POST /api/tasks` and `GET/PATCH/DELETE /api/tasks/[id]`. Input is validated on the server; titles are limited to 200 characters and descriptions to 10,000 characters.

## Project structure

- `src/app/page.tsx` — server-rendered home page and initial task data
- `src/components/task-workspace.tsx` — home list, search, pagination, and task side-panel/dialog interactions
- `src/app/api/tasks/` — task collection and item API routes
- `src/lib/tasks.ts` — SQLite setup, validation, and task queries
