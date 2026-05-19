// ==========================================
// CLIENT-SIDE CONFIG (Safe for "use client")
// ==========================================

export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
} as const;

// Validate client config at runtime
if (typeof window !== "undefined") {
  if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
    throw new Error("Missing Cloudinary environment configuration keys.");
  }
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  bytes: number;
  original_filename: string;
  created_at: string;
}

export interface CloudinaryError {
  error: {
    message: string;
  };
}
