import { v2 as cloudinary } from "cloudinary";

// Server-side configuration - ONLY call inside Server Actions or Route Handlers
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/**
 * Best-effort removal of an archived resume file (raw upload). Never throws:
 * a failed cleanup must not block deleting the resume or the account.
 */
export async function destroyStoredFile(fileUrl: string) {
  try {
    // .../raw/upload/v123/resumedocs/name.pdf -> "resumedocs/name.pdf" (raw ids keep the extension)
    const match = fileUrl.match(/\/raw\/upload\/(?:v\d+\/)?(.+)$/);
    if (!match) return;
    await cloudinary.uploader.destroy(decodeURIComponent(match[1]), { resource_type: "raw" });
  } catch (error) {
    console.warn("Stored file cleanup failed (non-fatal):", error);
  }
}
