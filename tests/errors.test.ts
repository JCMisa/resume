import { describe, expect, it } from "vitest";
import { publicErrorMessage } from "@/lib/errors";

const FALLBACK = "Something went wrong. Please try again.";

describe("publicErrorMessage", () => {
  it("keeps our own friendly messages", () => {
    expect(publicErrorMessage(new Error("Resume not found."), FALLBACK)).toBe("Resume not found.");
    expect(publicErrorMessage("You've used all 3 tailored resumes.", FALLBACK)).toBe("You've used all 3 tailored resumes.");
  });

  it("hides messages that name internal services", () => {
    for (const m of [
      "Empty response from Gemini.",
      "No Clerk user plan with key \"pro\".",
      "Missing Cloudinary environment configuration keys.",
      "NeonDbError: connection terminated",
      "Vapi error: call failed",
      "Upload preset not found on cloudinary",
    ]) {
      expect(publicErrorMessage(new Error(m), FALLBACK)).toBe(FALLBACK);
    }
  });

  it("hides raw runtime errors, empty and very long messages", () => {
    expect(publicErrorMessage(new Error("Cannot read properties of undefined (reading 'id')"), FALLBACK)).toBe(FALLBACK);
    expect(publicErrorMessage(new Error("fetch failed"), FALLBACK)).toBe(FALLBACK);
    expect(publicErrorMessage(new Error("   "), FALLBACK)).toBe(FALLBACK);
    expect(publicErrorMessage(new Error("x".repeat(250)), FALLBACK)).toBe(FALLBACK);
    expect(publicErrorMessage({ weird: true }, FALLBACK)).toBe(FALLBACK);
  });
});
