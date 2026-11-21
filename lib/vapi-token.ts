import "server-only";

import { createHmac } from "node:crypto";

// Vapi web calls authenticate with a short-lived JWT that WE sign with the
// private API key (HS256), instead of a long-lived public key shipped to every
// browser. Tokens are only minted after the server has checked the user's plan,
// so nobody can start Vapi calls on our credits without going through the app.
// Docs: https://docs.vapi.ai/customization/jwt-authentication

/** Long enough to connect and run a full (5-minute) interview. Vapi max is 1h. */
const TOKEN_TTL_SECONDS = 10 * 60;

const b64url = (value: string | Buffer) =>
  Buffer.from(value).toString("base64url");

export function mintVapiWebToken() {
  const orgId = process.env.VAPI_ORG_ID;
  const privateKey = process.env.VAPI_PRIVATE_API_KEY;
  if (!orgId || !privateKey) {
    throw new Error("Voice interviews aren't configured on the server.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    orgId,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
    token: {
      tag: "public", // usable by the Web SDK only
      restrictions: {
        // The interviewer is built per call in lib/vapi.config.ts
        allowTransientAssistant: true,
      },
    },
  };

  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = createHmac("sha256", privateKey)
    .update(unsigned)
    .digest("base64url");

  return `${unsigned}.${signature}`;
}
