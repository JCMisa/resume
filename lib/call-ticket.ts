import { createHmac, timingSafeEqual } from "node:crypto";

// One-time "call ticket" for starting a voice interview through our Vapi proxy
// (app/api/vapi/call/web/route.ts).
//
// Why not Clerk auth in that route: the Vapi SDK always sends
// "Authorization: Bearer <token>", and Clerk treats any Authorization header as
// a session token (it wins over the cookie), so the request would be "signed
// out". Instead the ticket proves who it's for: an HMAC-signed
// {session id, user id, expiry}, issued by createInterviewSessionAction after
// the plan + rate-limit checks. The route also claims the session atomically,
// so a ticket starts at most one call.

export type CallTicket = { sid: string; uid: string; exp: number };

const b64url = (v: string | Buffer) => Buffer.from(v).toString("base64url");

const sign = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest("base64url");

/** Signing key derived from a server secret (purpose-bound, so it can't be confused with other uses). */
export function ticketKey(serverSecret: string) {
  return createHmac("sha256", serverSecret).update("resume:vapi-call-ticket:v1").digest("hex");
}

export function signCallTicket(ticket: CallTicket, key: string): string {
  const payload = b64url(JSON.stringify(ticket));
  return `${payload}.${sign(payload, key)}`;
}

/** The ticket's contents if the signature is valid and it hasn't expired; otherwise null. */
export function verifyCallTicket(token: string, key: string, nowSeconds = Date.now() / 1000): CallTicket | null {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;

  const expected = Buffer.from(sign(payload, key));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const t = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<CallTicket>;
    if (typeof t.sid !== "string" || typeof t.uid !== "string" || typeof t.exp !== "number") return null;
    if (t.exp < nowSeconds) return null;
    return { sid: t.sid, uid: t.uid, exp: t.exp };
  } catch {
    return null;
  }
}
