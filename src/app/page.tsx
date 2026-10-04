import { SiteShell } from "@/components/site-shell";
import { TaskList } from "@/components/task-list";
import { listTasks } from "@/lib/tasks";

type HomeProps = {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
};

export const runtime = "nodejs";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const requestedSearch = firstValue(params.q)?.trim() ?? "";
  const searchIsTooLong = requestedSearch.length > 200;
  const search = searchIsTooLong ? "" : requestedSearch;
  const requestedPage = Number(firstValue(params.page) ?? "1");
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage >= 1 && requestedPage <= 1_000_000
      ? requestedPage
      : 1;
  const taskPage = await listTasks(search, page);

  return (
    <SiteShell>
      <section className="hero-row" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">A little more clarity</p>
          <h1 id="page-title">Your tasks</h1>
          <p className="hero-copy">
            Keep the important things in view, and make room for your next good idea.
          </p>
        </div>
        <a className="button button-primary" href="/tasks/new">
          <span aria-hidden="true">+</span>
          New task
        </a>
      </section>
      <TaskList
        page={page}
        search={search}
        searchIsTooLong={searchIsTooLong}
        taskPage={taskPage}
      />
      <p className="footer-note">One thing at a time is still progress.</p>
    </SiteShell>
  );
}
