import { SiteShell } from "@/components/site-shell";
import { TaskWorkspace } from "@/components/task-workspace";
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
  const search = requestedSearch.length <= 200 ? requestedSearch : "";
  const requestedPage = Number(firstValue(params.page) ?? "1");
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage >= 1 && requestedPage <= 1_000_000
      ? requestedPage
      : 1;
  const taskPage = await listTasks(search, page);

  return (
    <SiteShell>
      <TaskWorkspace initialPage={taskPage} initialSearch={search} />
    </SiteShell>
  );
}
