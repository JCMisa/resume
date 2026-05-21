/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateResumeFileUrlAction } from "@/lib/actions/resume";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";

interface UploaderProps {
  resumeId: string;
}

export default function ResumeFileUploader({ resumeId }: UploaderProps) {
  const router = useRouter();

  const { uploadDocument } = useCloudinaryUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Safety Gate: Ensure it's a PDF document
    if (selectedFile.type !== "application/pdf") {
      toast.error("Invalid file format", {
        description: "Please select a standard text-based PDF document.",
      });
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading(
      "Uploading resume binary to secure cloud backup...",
    );

    try {
      // 1. Upload the binary layout cleanly to Cloudinary
      const cloudUpload = await uploadDocument(selectedFile);
      const secureUrl = cloudUpload.secure_url;

      if (!secureUrl)
        throw new Error(
          "Failed to retrieve cloud link descriptor from Cloudinary.",
        );

      // 2. Fire the server action to map the link directly into the Drizzle resume record
      const response = await updateResumeFileUrlAction(resumeId, secureUrl);

      if (response.success) {
        toast.success("Document backup attached successfully!", {
          id: toastId,
        });

        // 🔄 Invalidate and trigger an active server data re-fetch for the viewer frame context
        router.refresh();
      } else {
        throw new Error(response.error || "Database attachment rejected.");
      }
    } catch (error: any) {
      console.error("Attachment workflow crash:", error);
      toast.error(error.message || "Failed to finalize document upload.", {
        id: toastId,
      });
    } finally {
      setIsUploading(false);
      // Reset input value so the same file can be re-uploaded if necessary
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      {/* Hidden native pointer element handle */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />

      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        variant="outline"
        className="w-full py-4 mt-5 font-bold rounded-lg border border-dashed border-border hover:border-primary/50 transition-all gap-2"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Uploading PDF Archive...
          </>
        ) : (
          <>
            <UploadCloud className="h-4 w-4 text-primary" />
            Attach Original PDF Document
          </>
        )}
      </Button>
    </div>
  );
}
