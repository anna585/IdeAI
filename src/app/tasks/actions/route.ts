import { NextRequest, NextResponse } from "next/server";
import {
  createTask,
  deleteTask,
  parseTaskInput,
  TaskInputError,
  updateTask,
} from "@/lib/tasks";

export const runtime = "nodejs";

function isTaskId(value: FormDataEntryValue | null): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function errorPage(message: string, status: number) {
  return new NextResponse(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Task not saved — IdeAI</title><body><main><h1>Task not saved</h1><p>${message}</p><p>Your submitted form values are not changed in storage. Use your browser back button to return to the form and try again.</p><p><a href="/">Return to your tasks</a></p></main></body></html>`,
    {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch (error) {
    console.error("Failed to read task form:", error);
    return errorPage("The form could not be read. Please go back and try again.", 400);
  }

  const intent = form.get("intent");
  const taskId = form.get("taskId");

  try {
    if (intent === "create" || intent === "update") {
      const title = form.get("title");
      const description = form.get("description");
      const input = parseTaskInput({
        title,
        description: description === null ? "" : description,
      });

      if (intent === "create") {
        await createTask(input);
      } else {
        if (!isTaskId(taskId)) {
          return errorPage("The task identifier is invalid.", 400);
        }
        const task = await updateTask(taskId, input);
        if (!task) {
          return errorPage("This task could not be found.", 404);
        }
      }

      return NextResponse.redirect(new URL("/", request.url), 303);
    }

    if (intent === "delete") {
      if (!isTaskId(taskId)) {
        return errorPage("The task identifier is invalid.", 400);
      }
      if (!(await deleteTask(taskId))) {
        return errorPage("This task could not be found.", 404);
      }
      return NextResponse.redirect(new URL("/", request.url), 303);
    }

    return errorPage("The requested task action is invalid.", 400);
  } catch (error) {
    if (error instanceof TaskInputError) {
      return errorPage(error.message, 400);
    }
    console.error("Failed to process task form:", error);
    return errorPage("A storage error prevented this change. Please try again.", 500);
  }
}
