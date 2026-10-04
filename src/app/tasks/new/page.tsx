import { SiteShell } from "@/components/site-shell";
import { TaskForm } from "@/components/task-form";

export const runtime = "nodejs";

export default function NewTaskPage() {
  return (
    <SiteShell>
      <div className="page-heading">
        <p className="eyebrow">A little more clarity</p>
        <h1>New task</h1>
        <p className="hero-copy">Capture what is on your mind and give it a place in your list.</p>
      </div>
      <TaskForm action="create" />
    </SiteShell>
  );
}
