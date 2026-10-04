import type { TaskPage } from "@/lib/tasks";

type TaskListProps = {
  taskPage: TaskPage;
  search: string;
  searchIsTooLong: boolean;
  page: number;
};

export function TaskList({
  taskPage,
  search,
  searchIsTooLong,
  page,
}: TaskListProps) {
  const startNumber = taskPage.total === 0 ? 0 : (page - 1) * taskPage.pageSize + 1;
  const endNumber = Math.min(page * taskPage.pageSize, taskPage.total);
  const pageCount = Math.max(1, Math.ceil(taskPage.total / taskPage.pageSize));

  function pageHref(targetPage: number) {
    const query = new URLSearchParams();
    if (search) query.set("q", search);
    query.set("page", String(targetPage));
    return `/?${query.toString()}`;
  }

  return (
    <section className="task-panel" aria-label="Task list">
      <form action="/" className="search-row" method="get">
        <label className="search-field">
          <span className="sr-only">Search tasks</span>
          <input
            className="search-input"
            defaultValue={search}
            maxLength={200}
            name="q"
            placeholder="Search your tasks..."
            type="search"
          />
        </label>
        <button className="button button-secondary search-button" type="submit">
          Search
        </button>
        <div className="task-count">
          <strong>{taskPage.total}</strong> {taskPage.total === 1 ? "task" : "tasks"}
        </div>
      </form>

      {searchIsTooLong && (
        <p className="alert" role="alert">
          Search text must be 200 characters or fewer.
        </p>
      )}

      <div className="list-heading">
        <span>{search ? "Search results" : "Your list"}</span>
        <span className="list-heading-count">
          {taskPage.total > 0 ? `${taskPage.total} total` : "Ready when you are"}
        </span>
      </div>

      <div className="task-list">
        {taskPage.tasks.length === 0 ? (
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
              <a className="button button-secondary" href="/">
                Clear search
              </a>
            ) : (
              <a className="button button-primary" href="/tasks/new">
                Create your first task
              </a>
            )}
          </div>
        ) : (
          taskPage.tasks.map((task) => (
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
                <a
                  aria-label={`Edit ${task.title}`}
                  className="icon-button"
                  href={`/tasks/${task.id}/edit`}
                >
                  <span aria-hidden="true">Edit</span>
                </a>
                <a
                  aria-label={`Delete ${task.title}`}
                  className="icon-button icon-button-danger"
                  href={`/tasks/${task.id}/delete`}
                >
                  <span aria-hidden="true">Delete</span>
                </a>
              </div>
            </article>
          ))
        )}
      </div>

      {taskPage.total > 0 && (
        <nav aria-label="Task pages" className="pagination">
          <span className="pagination-summary">
            Showing {startNumber}–{endNumber} of {taskPage.total}
          </span>
          <div className="pagination-controls">
            {page > 1 ? (
              <a className="pagination-button" href={pageHref(page - 1)}>
                Previous
              </a>
            ) : (
              <span aria-disabled="true" className="pagination-button is-disabled">
                Previous
              </span>
            )}
            {page < pageCount ? (
              <a className="pagination-button" href={pageHref(page + 1)}>
                Next
              </a>
            ) : (
              <span aria-disabled="true" className="pagination-button is-disabled">
                Next
              </span>
            )}
          </div>
        </nav>
      )}
    </section>
  );
}
