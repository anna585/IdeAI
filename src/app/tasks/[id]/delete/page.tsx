import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { getTask } from "@/lib/tasks";

export const runtime = "nodejs";

type DeleteTaskPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DeleteTaskPage({ params }: DeleteTaskPageProps) {
  const { id } = await params;
  const task = await getTask(id);

  if (!task) {
    notFound();
  }

  return (
    <SiteShell>
      <div className="page-heading">
        <p className="eyebrow">Before you go</p>
        <h1>Delete task?</h1>
        <p className="hero-copy">This action cannot be undone.</p>
      </div>
      <section className="form-card">
        <h2 className="task-title">{task.title}</h2>
        {task.description && <p className="task-description">{task.description}</p>}
        <form action="/tasks/actions" className="form-footer delete-form" method="post">
          <input name="intent" type="hidden" value="delete" />
          <input name="taskId" type="hidden" value={task.id} />
          <a className="button button-secondary" href="/">
            Keep task
          </a>
          <button className="button button-danger" type="submit">
            Delete task
          </button>
        </form>
      </section>
    </SiteShell>
  );
}
