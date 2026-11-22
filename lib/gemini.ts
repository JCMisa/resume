import "server-only";

import { GoogleGenAI } from "@google/genai";

// Shared Gemini structured-output call: JSON schema + parse/sanitize + one
// retry (bad JSON, 503, timeout). temperature 0 so the same input gives
// (nearly) the same judgments.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateStructured<T>({
  model,
  prompt,
  schema,
  parse,
  label,
  files,
}: {
  model: string;
  prompt: string;
  /** Inline files sent before the prompt (e.g. a scanned PDF), base64 */
  files?: { mimeType: string; data: string }[];
  /** Keep it simple: no maxItems/min/max (Gemini rejects heavily constrained schemas) */
  schema: unknown;
  /** Sanitize the parsed JSON; throw to trigger the retry */
  parse: (json: unknown) => T;
  /** For logs */
  label: string;
}): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: files?.length
          ? [
              {
                role: "user",
                parts: [
                  ...files.map((f) => ({ inlineData: { mimeType: f.mimeType, data: f.data } })),
                  { text: prompt },
                ],
              },
            ]
          : prompt,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: schema,
          temperature: 0,
        },
      });
      if (!response.text) throw new Error("Empty response from Gemini.");
      return parse(JSON.parse(response.text));
    } catch (error) {
      lastError = error;
      console.warn(`${label} attempt ${attempt} failed:`, error);
    }
  }
  throw lastError;
}
