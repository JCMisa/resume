import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/config/db";
import { resumes } from "@/config/schema";
import { currentUserIsPro } from "@/lib/plan-tier";
import { buildResumeDocx } from "@/lib/resume-docx";
import { sanitizeEditorContent } from "@/lib/resume-editor";
import { resolveTemplate } from "@/lib/resume-templates";
import { fileSlug } from "@/lib/resume-share";

// Word (.docx) export of the user's own built resume. Pro feature, checked
// here on the server (the button is only a shortcut).

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ message: "Sign in to download." }, { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ message: "Resume not found." }, { status: 404 });

  if (!(await currentUserIsPro())) {
    return Response.json({ message: "Word export is a Pro feature." }, { status: 403 });
  }

  const [row] = await db
    .select({ title: resumes.title, templateId: resumes.templateId, content: resumes.content })
    .from(resumes)
    .where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
  if (!row) return Response.json({ message: "Resume not found." }, { status: 404 });

  try {
    const buffer = await buildResumeDocx(sanitizeEditorContent(row.content), resolveTemplate(row.templateId), row.title);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileSlug(row.title)}.docx"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("DOCX Export Failure:", error);
    return Response.json({ message: "Couldn't create the Word file. Try again." }, { status: 500 });
  }
}
