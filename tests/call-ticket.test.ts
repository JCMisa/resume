import { describe, expect, it } from "vitest";
import { signCallTicket, ticketKey, verifyCallTicket } from "@/lib/call-ticket";

const key = ticketKey("test-server-secret");
const ticket = { sid: "11111111-1111-1111-1111-111111111111", uid: "user_abc", exp: 2_000 };

describe("call tickets", () => {
  it("round-trips a valid ticket before it expires", () => {
    expect(verifyCallTicket(signCallTicket(ticket, key), key, 1_000)).toEqual(ticket);
  });

  it("rejects expired tickets", () => {
    expect(verifyCallTicket(signCallTicket(ticket, key), key, 2_001)).toBeNull();
  });

  it("rejects tickets signed with another key", () => {
    const other = ticketKey("another-secret");
    expect(verifyCallTicket(signCallTicket(ticket, other), key, 1_000)).toBeNull();
  });

  it("rejects tampered payloads (e.g. someone else's session or user)", () => {
    const [, sig] = signCallTicket(ticket, key).split(".");
    const forged = Buffer.from(JSON.stringify({ ...ticket, uid: "user_victim" })).toString("base64url");
    expect(verifyCallTicket(`${forged}.${sig}`, key, 1_000)).toBeNull();
  });

  it("rejects malformed tokens, including a Clerk-style JWT or a bare session id", () => {
    for (const t of ["", "abc", "a.b.c", ticket.sid, `${signCallTicket(ticket, key)}.extra`]) {
      expect(verifyCallTicket(t, key, 1_000)).toBeNull();
    }
  });

  it("derives a purpose-bound key (not the raw secret)", () => {
    expect(key).not.toBe("test-server-secret");
    expect(key).toHaveLength(64);
  });
});
