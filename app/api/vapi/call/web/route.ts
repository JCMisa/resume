import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { and, eq, gte, isNull } from "drizzle-orm";
import { db } from "@/config/db";
import { interviews } from "@/config/schema";
import { configureAssistant } from "@/lib/vapi.config";
import { CALL_TICKET_TTL_SECONDS } from "@/lib/interview";
import { ticketKey, verifyCallTicket } from "@/lib/call-ticket";
import { mintVapiPublicToken } from "@/lib/vapi-token";

// Vapi Web SDK proxy (docs.vapi.ai/security-and-privacy/proxy-server).
//
// Agent.tsx creates the SDK with this app as its API base URL, so the SDK's
// "create web call" request lands here instead of at api.vapi.ai. We ignore
// whatever assistant config the browser sent and build it on the server from
// the stored session, so the 5-minute limit, model and prompt can't be
// tampered with. The private key (and the public JWT signed with it for the
// create-call request) never leave the server.
//
// The SDK sends `Authorization: Bearer <token>`; the token is the signed,
// short-lived call ticket from createInterviewSessionAction (lib/call-ticket.ts).
// Clerk auth isn't used here: Clerk would read that header as a (bad) session
// token. This route is public in proxy.ts and trusts only the ticket.

const VAPI_API = "https://api.vapi.ai";

function json(status: number, message: string) {
  return NextResponse.json({ message }, { status });
}

export async function POST(request: Request) {
  // Same-origin only (the SDK runs on our pages)
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return json(403, "Cross-origin requests aren't allowed.");
  }

  const privateKey = process.env.VAPI_PRIVATE_API_KEY;
  if (!privateKey || !process.env.VAPI_ORG_ID) return json(503, "Voice interviews aren't configured on the server.");

  const token = (request.headers.get("authorization") ?? "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  const ticket = verifyCallTicket(token, ticketKey(privateKey));
  if (!ticket) return json(401, "This interview session expired. Start a new session.");
  const { sid: sessionId, uid: userId } = ticket;

  // Claim the session atomically: the user's own, still in progress, recent,
  // and never used for a call. A second call on the same ticket is rejected.
  const ticketCutoff = new Date(Date.now() - CALL_TICKET_TTL_SECONDS * 1000);
  const [session] = await db
    .update(interviews)
    .set({ vapiCallId: "pending" })
    .where(
      and(
        eq(interviews.id, sessionId),
        eq(interviews.userId, userId),
        eq(interviews.status, "in-progress"),
        isNull(interviews.vapiCallId),
        gte(interviews.createdAt, ticketCutoff),
      ),
    )
    .returning({
      id: interviews.id,
      jobRole: interviews.jobRole,
      jobDescription: interviews.jobDescription,
      resumeText: interviews.resumeText,
    });
  if (!session) {
    return json(409, "This interview session can't start a call. Start a new session.");
  }

  const user = await (await clerkClient()).users.getUser(userId).catch(() => null);
  const assistant = configureAssistant(
    user?.firstName || "Candidate",
    session.jobRole,
    session.jobDescription ?? "",
    session.resumeText,
  );

  try {
    const res = await fetch(`${VAPI_API}/call/web`, {
      method: "POST",
      headers: {
        // /call/web only accepts public credentials: a short-lived public JWT
        // signed server-side (lib/vapi-token.ts), never sent to the browser
        Authorization: `Bearer ${mintVapiPublicToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistant: {
          ...assistant,
          // Lets the call be traced back to the session in the Vapi dashboard
          metadata: { sessionId: session.id, userId },
        },
      }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.id) {
      console.error("Vapi create web call failed:", res.status, data);
      // Release the ticket; the client cancels (and refunds) the session
      await db
        .update(interviews)
        .set({ vapiCallId: null })
        .where(and(eq(interviews.id, session.id), eq(interviews.userId, userId)));
      return json(502, "The voice service couldn't start the call. Please try again.");
    }

    await db
      .update(interviews)
      .set({ vapiCallId: String(data.id) })
      .where(and(eq(interviews.id, session.id), eq(interviews.userId, userId)));

    // Return what the SDK needs; never the live monitor/control URLs or the
    // server-built prompt.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { monitor, assistant: returnedAssistant, ...rest } = data;
    return NextResponse.json({
      ...rest,
      assistant: returnedAssistant?.voice ? { voice: returnedAssistant.voice } : undefined,
    });
  } catch (error) {
    console.error("Vapi proxy failure:", error);
    await db
      .update(interviews)
      .set({ vapiCallId: null })
      .where(and(eq(interviews.id, session.id), eq(interviews.userId, userId)));
    return json(502, "The voice service couldn't start the call. Please try again.");
  }
}
