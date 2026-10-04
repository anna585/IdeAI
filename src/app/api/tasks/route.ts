import { NextRequest, NextResponse } from "next/server";
import { listTasks, parseTaskInput, TaskInputError, createTask } from "@/lib/tasks";

export const runtime = "nodejs";

function parsePage(value: string | null): number | undefined {
  if (value === null) {
    return 1;
  }

  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 && page <= 1_000_000
    ? page
    : undefined;
}

export async function GET(request: NextRequest) {
  const page = parsePage(request.nextUrl.searchParams.get("page"));
  if (page === undefined) {
    return NextResponse.json({ error: "Page must be a positive whole number." }, { status: 400 });
  }

  const search = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (search.length > 200) {
    return NextResponse.json({ error: "Search must be under 200 characters." }, { status: 400 });
  }

  try {
    return NextResponse.json(await listTasks(search, page));
  } catch (error) {
    console.error("Failed to load tasks:", error);
    return NextResponse.json({ error: "Tasks could not be loaded. Please try again." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let input;
  try {
    input = parseTaskInput(await request.json());
  } catch (error) {
    if (error instanceof TaskInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    console.error("Failed to read new task:", error);
    return NextResponse.json({ error: "The task could not be saved. Please try again." }, { status: 500 });
  }

  try {
    return NextResponse.json(await createTask(input), { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: "The task could not be saved. Please try again." }, { status: 500 });
  }
}
