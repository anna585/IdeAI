# IdeAI

IdeAI is a small, multi-page task manager built with Next.js, TypeScript, and SQLite. Tasks have a required title and an optional description. The task list, create form, edit form, and delete confirmation each have their own URL. Navigation uses ordinary links, and search and task changes use standard HTML form submissions with full-page responses and redirects.

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

The task list returns 30 results per page. Search matches task titles and descriptions using a GET form. Create, edit, and delete forms submit to a server route and redirect to the task list after success; titles are limited to 200 characters and descriptions to 10,000 characters. JSON API routes are also available under `/api/tasks`.

## Project structure

- `src/app/page.tsx` — server-rendered task list
- `src/app/tasks/` — create, edit, delete confirmation, and form submission routes
- `src/components/task-list.tsx` — task list, search, and pagination
- `src/components/task-form.tsx` — native HTML create and edit forms
- `src/app/api/tasks/` — task collection and item API routes
- `src/lib/tasks.ts` — SQLite setup, validation, and task queries
