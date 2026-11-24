import "server-only";

import { sql } from "drizzle-orm";
import { db } from "@/config/db";
import { AUTO_VERSION_MINUTES, MAX_VERSIONS, type VersionKind } from "@/lib/resume-versions";

/**
 * Copy the resume's current saved state into resume_versions (one SQL
 * statement, scoped to the owner). For "auto", nothing is written when an
 * automatic version was already taken in the last AUTO_VERSION_MINUTES.
 * Returns the new version id, or null when nothing was written.
 */
export async function snapshotResume(
  userId: string,
  resumeId: string,
  kind: VersionKind,
  label: string | null = null,
): Promise<string | null> {
  const quiet =
    kind === "auto"
      ? sql`and not exists (
          select 1 from resume_versions v
          where v.resume_id = r.id and v.kind = 'auto'
            and v.created_at > now() - make_interval(mins => ${AUTO_VERSION_MINUTES})
        )`
      : sql``;
  const result = await db.execute(sql`
    insert into resume_versions (resume_id, user_id, kind, label, title, template_id, content)
    select r.id, r.user_id, ${kind}, ${label}, r.title, r.template_id, r.content
    from resumes r
    where r.id = ${resumeId} and r.user_id = ${userId} and r.status = 'created' ${quiet}
    returning id
  `);
  const id = (result.rows[0] as { id?: string } | undefined)?.id ?? null;
  if (id) await pruneVersions(resumeId);
  return id;
}

/** Keep only the newest MAX_VERSIONS for a resume. */
async function pruneVersions(resumeId: string) {
  await db.execute(sql`
    delete from resume_versions
    where id in (
      select id from resume_versions
      where resume_id = ${resumeId}
      order by created_at desc
      offset ${MAX_VERSIONS}
    )
  `);
}
