import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { TaskForm } from "@/components/task-form";
import { getTask } from "@/lib/tasks";

export const runtime = "nodejs";

type EditTaskPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { id } = await params;
  const task = await getTask(id);

  if (!task) {
    notFound();
  }

  return (
    <SiteShell>
      <div className="page-heading">
        <p className="eyebrow">A little more clarity</p>
        <h1>Edit task</h1>
        <p className="hero-copy">Update the details and save your changes.</p>
      </div>
      <TaskForm
        action="update"
        description={task.description}
        taskId={task.id}
        title={task.title}
      />
    </SiteShell>
  );
}
