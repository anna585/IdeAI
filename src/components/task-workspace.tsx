"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Task, TaskPage } from "@/lib/tasks";

type TaskWorkspaceProps = {
  initialPage: TaskPage;
  initialSearch: string;
};

type TaskFields = {
  title: string;
  description: string;
};

function messageFrom(value: unknown, fallback: string): string {
  if (typeof value === "object" && value !== null && "error" in value) {
    const error = value.error;
    if (typeof error === "string") return error;
  }
  return fallback;
}

async function responseBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function TaskWorkspace({ initialPage, initialSearch }: TaskWorkspaceProps) {
  const [data, setData] = useState(initialPage);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage.page);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [editor, setEditor] = useState<(TaskFields & { id?: string }) | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestController = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      requestController.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (!editor && !deleteTask) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        setEditor(null);
        setDeleteTask(null);
        setFormError("");
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [editor, deleteTask, saving]);

  async function loadTasks(nextSearch = search, nextPage = page) {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(nextPage) });
    if (nextSearch) params.set("q", nextSearch);

    try {
      const response = await fetch(`/api/tasks?${params.toString()}`, {
        signal: controller.signal,
      });
      const body = await responseBody(response);
      if (!response.ok) {
        throw new Error(messageFrom(body, "Tasks could not be loaded. Please try again."));
      }
      setData(body as TaskPage);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(
        cause instanceof Error
          ? cause.message
          : "Tasks could not be loaded. Please try again.",
      );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  function changeSearch(value: string) {
    setSearchInput(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      const nextSearch = value.trim();
      setSearch(nextSearch);
      setPage(1);
      void loadTasks(nextSearch, 1);
    }, 220);
  }

  function openCreate() {
    setFormError("");
    setEditor({ title: "", description: "" });
  }

  function openEdit(task: Task) {
    setFormError("");
    setEditor({ id: task.id, title: task.title, description: task.description });
  }

  async function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    if (!title) {
      setFormError("A title is needed before you can save this task.");
      titleRef.current?.focus();
      return;
    }

    requestController.current?.abort();
    setSaving(true);
    setFormError("");
    setError("");

    try {
      const response = await fetch(editor.id ? `/api/tasks/${editor.id}` : "/api/tasks", {
        method: editor.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const body = await responseBody(response);
      if (!response.ok) {
        throw new Error(messageFrom(body, "The task could not be saved. Please try again."));
      }

      setEditor(null);
      if (!editor.id) {
        setSearch("");
        setSearchInput("");
        setPage(1);
        await loadTasks("", 1);
      } else {
        await loadTasks();
      }
    } catch (cause) {
      setFormError(
        cause instanceof Error ? cause.message : "The task could not be saved. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTask) return;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    requestController.current?.abort();
    setSaving(true);
    setError("");
    setFormError("");
    setFormError("");
    try {
      const response = await fetch(`/api/tasks/${deleteTask.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await responseBody(response);
        throw new Error(messageFrom(body, "The task could not be deleted. Please try again."));
      }

      setDeleteTask(null);
      setFormError("");
      const nextPage =
        data.tasks.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      await loadTasks(search, nextPage);
    } catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : "The task could not be deleted. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  const pageCount = Math.max(1, Math.ceil(data.total / data.pageSize));
  const startNumber = data.total === 0 ? 0 : (page - 1) * data.pageSize + 1;
  const endNumber = Math.min(page * data.pageSize, data.total);

  return (
    <>
      <section className="hero-row" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">A little more clarity</p>
          <h1 id="page-title">Your tasks</h1>
          <p className="hero-copy">
            Keep the important things in view, and make room for your next good idea.
          </p>
        </div>
        <button className="button button-primary" onClick={openCreate} type="button">
          <span aria-hidden="true">+</span>
          New task
        </button>
      </section>

      <section aria-label="Task list" aria-busy={loading} className="task-panel">
        <div className="search-row">
          <label className="search-field">
            <span className="sr-only">Search tasks</span>
            <span aria-hidden="true" className="search-icon">
              ⌕
            </span>
            <input
              className="search-input"
              maxLength={200}
              onChange={(event) => changeSearch(event.target.value)}
              placeholder="Search your tasks..."
              type="search"
              value={searchInput}
            />
          </label>
          <div aria-live="polite" className="task-count">
            <strong>{data.total}</strong> {data.total === 1 ? "task" : "tasks"}
          </div>
        </div>

        {error && (
          <div className="alert" role="alert">
            <span>{error}</span>
            <button onClick={() => void loadTasks()} type="button">
              Retry
            </button>
          </div>
        )}

        <div className="list-heading">
          <span>{search ? "Search results" : "Your list"}</span>
          <span className="list-heading-count">
            {loading ? "Loading..." : data.total > 0 ? `${data.total} total` : "Ready when you are"}
          </span>
        </div>

        <div className="task-list">
          {loading && data.tasks.length === 0 ? (
            <div className="empty-state" aria-live="polite">
              <p className="empty-copy">Loading tasks…</p>
            </div>
          ) : data.tasks.length === 0 ? (
            <div className="empty-state">
              <span aria-hidden="true" className="empty-icon">
                {search ? "⌕" : "↗"}
              </span>
              <p className="empty-title">{search ? "No tasks found" : "A fresh page"}</p>
              <p className="empty-copy">
                {search
                  ? "Try a different word, or clear your search to see everything."
                  : "Your list is clear. Add a task whenever something comes to mind."}
              </p>
              {search ? (
                <button
                  className="button button-secondary"
                  onClick={() => changeSearch("")}
                  type="button"
                >
                  Clear search
                </button>
              ) : (
                <button className="button button-primary" onClick={openCreate} type="button">
                  Create your first task
                </button>
              )}
            </div>
          ) : (
            data.tasks.map((task) => (
              <article className="task-card" key={task.id}>
                <div className="task-copy">
                  <h2 className="task-title">{task.title}</h2>
                  <p
                    className={
                      task.description
                        ? "task-description"
                        : "task-description task-description-empty"
                    }
                  >
                    {task.description || "No description"}
                  </p>
                </div>
                <div className="task-actions">
                  <button
                    aria-label={`Edit ${task.title}`}
                    className="icon-button"
                    onClick={() => openEdit(task)}
                    type="button"
                  >
                    <span aria-hidden="true">Edit</span>
                  </button>
                  <button
                    aria-label={`Delete ${task.title}`}
                    className="icon-button icon-button-danger"
                    onClick={() => {
                      setFormError("");
                      setDeleteTask(task);
                    }}
                    type="button"
                  >
                    <span aria-hidden="true">Delete</span>
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        {data.total > 0 && (
          <nav aria-label="Task pages" className="pagination">
            <span className="pagination-summary">
              Showing {startNumber}–{endNumber} of {data.total}
            </span>
            <div className="pagination-controls">
              <button
                className="pagination-button"
                disabled={loading || page <= 1}
                onClick={() => {
                  const nextPage = page - 1;
                  setPage(nextPage);
                  void loadTasks(search, nextPage);
                }}
                type="button"
              >
                Previous
              </button>
              <button
                className="pagination-button"
                disabled={loading || page >= pageCount}
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  void loadTasks(search, nextPage);
                }}
                type="button"
              >
                Next
              </button>
            </div>
          </nav>
        )}
      </section>

      <p className="footer-note">One thing at a time is still progress.</p>

      {editor && (
        <div
          className="panel-backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !saving) {
              setEditor(null);
              setFormError("");
            }
          }}
        >
          <aside
            aria-labelledby="task-panel-title"
            aria-modal="true"
            className="side-panel"
            role="dialog"
          >
            <div className="side-panel-header">
              <div>
                <p className="eyebrow">{editor.id ? "Make it yours" : "Start with one thing"}</p>
                <h2 id="task-panel-title">{editor.id ? "Edit task" : "Create a task"}</h2>
              </div>
              <button
                aria-label="Close panel"
                className="close-button"
                disabled={saving}
                onClick={() => {
                  setEditor(null);
                  setFormError("");
                }}
                type="button"
              >
                ×
              </button>
            </div>
            <p className="panel-intro">
              Keep it simple. Add a title, then include any details that will help.
            </p>
            <form className="task-form" onSubmit={(event) => void submitTask(event)}>
              <div className="form-field">
                <div className="form-label-row">
                  <label className="form-label" htmlFor="task-title">
                    Title
                  </label>
                  <span className="form-help">Required</span>
                </div>
                <input
                  ref={titleRef}
                  autoFocus
                  autoComplete="off"
                  className="form-input"
                  id="task-title"
                  maxLength={200}
                  name="title"
                    onChange={(event) => {
                      setFormError("");
                      setEditor({ ...editor, title: event.target.value });
                    }}
                    placeholder="What needs doing?"
                    required
                    value={editor.title}
                />
              </div>
              <div className="form-field">
                <div className="form-label-row">
                  <label className="form-label" htmlFor="task-description">
                    Description
                  </label>
                  <span className="form-optional">Optional</span>
                </div>
                <textarea
                  className="form-textarea"
                  id="task-description"
                  maxLength={10_000}
                  name="description"
                  onChange={(event) => {
                    setFormError("");
                    setEditor({ ...editor, description: event.target.value });
                  }}
                  placeholder="Add a few useful details..."
                  value={editor.description}
                />
              </div>
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <div className="panel-footer">
                <button
                  className="button button-secondary"
                  disabled={saving}
                  onClick={() => {
                    setEditor(null);
                    setFormError("");
                  }}
                  type="button"
                >
                  Cancel
                </button>
                <button className="button button-primary" disabled={saving} type="submit">
                  {saving ? "Saving..." : editor.id ? "Save changes" : "Create task"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {deleteTask && (
        <div
          className="confirm-backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !saving) setDeleteTask(null);
          }}
        >
          <section
            aria-labelledby="delete-dialog-title"
            aria-modal="true"
            className="confirm-dialog"
            role="alertdialog"
          >
            <span aria-hidden="true" className="delete-icon">
              !
            </span>
            <h2 id="delete-dialog-title">Delete this task?</h2>
            <p>
              <strong>{deleteTask.title}</strong> will be permanently removed.
            </p>
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <div className="panel-footer">
              <button
                className="button button-secondary"
                disabled={saving}
                onClick={() => {
                  setDeleteTask(null);
                  setFormError("");
                }}
                type="button"
              >
                Keep task
              </button>
              <button
                className="button button-danger"
                disabled={saving}
                onClick={() => void confirmDelete()}
                type="button"
              >
                {saving ? "Deleting..." : "Delete task"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
