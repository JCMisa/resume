import "server-only";

import { createHmac } from "node:crypto";

// Vapi's create-web-call endpoint (POST /call/web) is public-scoped: it rejects
// the private API key and only accepts a public key or a public JWT. So the
// proxy (app/api/vapi/call/web/route.ts) signs a short-lived public JWT with the
// private key (HS256) and uses it for that one server-to-server request. The
// token never reaches the browser.
// Docs: https://docs.vapi.ai/customization/jwt-authentication

/** Only needs to live for the single create-call request. */
const TOKEN_TTL_SECONDS = 60;

const b64url = (value: string | Buffer) => Buffer.from(value).toString("base64url");

export function mintVapiPublicToken() {
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
      tag: "public",
      restrictions: {
        // The assistant is built per call on the server (lib/vapi.config.ts)
        allowTransientAssistant: true,
      },
    },
  };

  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = createHmac("sha256", privateKey).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}
