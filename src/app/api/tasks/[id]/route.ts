import { NextRequest, NextResponse } from "next/server";
import {
  deleteTask,
  getTask,
  parseTaskInput,
  TaskInputError,
  updateTask,
} from "@/lib/tasks";

export const runtime = "nodejs";

function validId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!validId(id)) {
    return NextResponse.json({ error: "This task could not be found." }, { status: 404 });
  }

  try {
    const task = await getTask(id);
    if (!task) {
      return NextResponse.json({ error: "This task could not be found." }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to load task:", error);
    return NextResponse.json(
      { error: "This task could not be loaded. Please try again." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!validId(id)) {
    return NextResponse.json({ error: "This task could not be found." }, { status: 404 });
  }

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
    console.error("Failed to read task update:", error);
    return NextResponse.json({ error: "The task could not be updated. Please try again." }, { status: 500 });
  }

  try {
    const task = await updateTask(id, input);
    if (!task) {
      return NextResponse.json({ error: "This task could not be found." }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json({ error: "The task could not be updated. Please try again." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  if (!validId(id)) {
    return NextResponse.json({ error: "This task could not be found." }, { status: 404 });
  }

  try {
    if (!(await deleteTask(id))) {
      return NextResponse.json({ error: "This task could not be found." }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json({ error: "The task could not be deleted. Please try again." }, { status: 500 });
  }
}
