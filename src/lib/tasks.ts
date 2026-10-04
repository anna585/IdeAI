import { mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sqlite3 from "sqlite3";
import { open, type Database } from "sqlite";

export const TASK_PAGE_SIZE = 30;

export type Task = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskPage = {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
};

export type TaskInput = {
  title: string;
  description: string;
};

export class TaskInputError extends Error {}

let databasePromise: Promise<Database> | undefined;

async function initializeDatabase(): Promise<Database> {
  const filename = path.join(process.cwd(), "data", "ideai.sqlite");
  await mkdir(path.dirname(filename), { recursive: true });

  const database = await open({
    filename,
    driver: sqlite3.Database,
  });

  try {
    await database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = FULL;
      PRAGMA busy_timeout = 5000;

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL CHECK (length(trim(title)) > 0),
        description TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS tasks_updated_at_idx
        ON tasks (updated_at DESC, id DESC);
    `);
    return database;
  } catch (error) {
    await database.close();
    throw error;
  }
}

export function getDatabase(): Promise<Database> {
  if (!databasePromise) {
    databasePromise = initializeDatabase().catch((error: unknown) => {
      databasePromise = undefined;
      throw error;
    });
  }

  return databasePromise;
}

export function parseTaskInput(value: unknown): TaskInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TaskInputError("Send a task object with a title and description.");
  }

  const input = value as Record<string, unknown>;
  if (
    typeof input.title !== "string" ||
    (input.description !== undefined && typeof input.description !== "string")
  ) {
    throw new TaskInputError("A title is required and the description must be text.");
  }

  const title = input.title.trim();
  const description = typeof input.description === "string" ? input.description.trim() : "";
  if (!title) {
    throw new TaskInputError("Add a title before saving this task.");
  }
  if (title.length > 200) {
    throw new TaskInputError("Keep the title under 200 characters.");
  }
  if (description.length > 10_000) {
    throw new TaskInputError("Keep the description under 10,000 characters.");
  }

  return { title, description };
}

function mapTask(row: {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listTasks(search: string, page: number): Promise<TaskPage> {
  const database = await getDatabase();
  const where = search
    ? "WHERE instr(lower(title), lower(?)) > 0 OR instr(lower(description), lower(?)) > 0"
    : "";
  const parameters = search ? [search, search] : [];
  const count = await database.get<{ total: number }>(
    `SELECT COUNT(*) AS total FROM tasks ${where}`,
    parameters,
  );
  if (count === undefined) {
    throw new Error("The task count could not be read from the database.");
  }
  const rows = await database.all<
    Array<{
      id: string;
      title: string;
      description: string;
      created_at: string;
      updated_at: string;
    }>
  >(
    `SELECT id, title, description, created_at, updated_at
     FROM tasks ${where}
     ORDER BY updated_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...parameters, TASK_PAGE_SIZE, (page - 1) * TASK_PAGE_SIZE],
  );

  return {
    tasks: rows.map(mapTask),
    total: count?.total ?? 0,
    page,
    pageSize: TASK_PAGE_SIZE,
  };
}

export async function getTask(id: string): Promise<Task | undefined> {
  const database = await getDatabase();
  const row = await database.get<{
    id: string;
    title: string;
    description: string;
    created_at: string;
    updated_at: string;
  }>("SELECT id, title, description, created_at, updated_at FROM tasks WHERE id = ?", id);

  return row ? mapTask(row) : undefined;
}

export async function createTask(input: TaskInput): Promise<Task> {
  const database = await getDatabase();
  const id = randomUUID();
  await database.run(
    `INSERT INTO tasks (id, title, description, created_at, updated_at)
     VALUES (?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`,
    id,
    input.title,
    input.description,
  );

  const row = await database.get<{
    id: string;
    title: string;
    description: string;
    created_at: string;
    updated_at: string;
  }>("SELECT id, title, description, created_at, updated_at FROM tasks WHERE id = ?", id);

  if (!row) {
    throw new Error("The task was inserted but could not be read back.");
  }

  return mapTask(row);
}

export async function updateTask(id: string, input: TaskInput): Promise<Task | undefined> {
  const database = await getDatabase();
  const result = await database.run(
    `UPDATE tasks
     SET title = ?, description = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ?`,
    input.title,
    input.description,
    id,
  );

  if (typeof result.changes !== "number") {
    throw new Error("The database did not report whether the task was updated.");
  }
  if (result.changes === 0) {
    return undefined;
  }

  const row = await database.get<{
    id: string;
    title: string;
    description: string;
    created_at: string;
    updated_at: string;
  }>("SELECT id, title, description, created_at, updated_at FROM tasks WHERE id = ?", id);

  if (!row) {
    throw new Error("The task was updated but could not be read back.");
  }

  return mapTask(row);
}

export async function deleteTask(id: string): Promise<boolean> {
  const database = await getDatabase();
  const result = await database.run("DELETE FROM tasks WHERE id = ?", id);
  if (typeof result.changes !== "number") {
    throw new Error("The database did not report whether the task was deleted.");
  }
  return result.changes > 0;
}
