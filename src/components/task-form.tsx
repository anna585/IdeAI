type TaskFormProps = {
  action: "create" | "update";
  title?: string;
  description?: string;
  taskId?: string;
};

export function TaskForm({
  action,
  title = "",
  description = "",
  taskId,
}: TaskFormProps) {
  const isEdit = action === "update";

  return (
    <section className="form-card">
      <div className="form-heading">
        <p className="eyebrow">{isEdit ? "Make it yours" : "Start with one thing"}</p>
        <h2>{isEdit ? "Edit task" : "Create a task"}</h2>
        <p>Keep it simple. Add a title, then include any details that will help.</p>
      </div>
      <form action="/tasks/actions" className="task-form" method="post">
        <input name="intent" type="hidden" value={action} />
        {taskId && <input name="taskId" type="hidden" value={taskId} />}
        <div className="form-field">
          <div className="form-label-row">
            <label className="form-label" htmlFor="task-title">
              Title
            </label>
            <span className="form-help">Required</span>
          </div>
          <input
            autoComplete="off"
            className="form-input"
            defaultValue={title}
            id="task-title"
            maxLength={200}
            name="title"
            placeholder="What needs doing?"
            required
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
            defaultValue={description}
            id="task-description"
            maxLength={10_000}
            name="description"
            placeholder="Add a few useful details..."
          />
          <p className="form-hint">Up to 10,000 characters.</p>
        </div>
        <div className="form-footer">
          <a className="button button-secondary" href="/">
            Cancel
          </a>
          <button className="button button-primary" type="submit">
            {isEdit ? "Save changes" : "Create task"}
          </button>
        </div>
      </form>
    </section>
  );
}
