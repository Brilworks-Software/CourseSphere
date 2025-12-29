"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, UploadCloud, XIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import { Dropzone, DropzoneEmptyState } from "@/components/kibo-ui/dropzone";

import {
  ImageCrop,
  ImageCropContent,
  ImageCropApply,
  ImageCropReset,
} from "@/components/kibo-ui/image-crop";
import { supabase } from "@/lib/supabaseClient";

// Popular aspect ratio presets
export const ASPECT_RATIOS = {
  square: 1,
  landscape: 16 / 9,
  portrait: 9 / 16,
  classic: 4 / 3,
  widescreen: 24 / 10,
  superWidescreen: 38 / 10,
  cinema: 2.39,
} as const;

export type AspectRatioPreset = keyof typeof ASPECT_RATIOS;

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string, file?: File) => void;
  onFileUpload?: (file: File) => Promise<string>;
  label?: string;
  maxSizeMB?: number;
  accept?: string;
  disabled?: boolean;
  showPreview?: boolean;
  className?: string;
  aspectRatio?: AspectRatioPreset | number; // only allow preset or custom number
  open?: boolean; // <-- add
  onOpenChange?: (open: boolean) => void; // <-- add
}

const IMAGE_BUCKET = process.env.NEXT_PUBLIC_IMAGE_BUCKET || "assets-bucket";
/**
 * ImageUploadWithCrop
 *
 * Props:
 * - value: current image URL (string)
 * - onChange: function(url: string, file?: File) => void
 * - onFileUpload: async function(file: File) => url (returns uploaded image url)
 * - label: string (optional)
 * - maxSizeMB: number (optional, default 5)
 * - accept: string (optional, default "image/*")
 * - disabled: boolean (optional)
 * - showPreview: boolean (optional, default true)
 * - aspectRatio: AspectRatioPreset | number (optional, default "landscape")
 * - className: string (optional)
 */
export default function ImageUploadWithCrop({
  value,
  onChange,
  onFileUpload,
  label = "Image",
  maxSizeMB = 5,
  accept = "image/*",
  disabled = false,
  showPreview = true,
  aspectRatio = "landscape", // default to landscape preset
  className = "",
  open,
  onOpenChange,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rawFile, setRawFile] = useState<File | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  // Remove local dialogOpen state if open prop is provided
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  const dialogOpen = open !== undefined ? open : internalDialogOpen;
  const setDialogOpen = onOpenChange || setInternalDialogOpen;
  const [croppedFile, setCroppedFile] = useState<File | null>(null); // <-- add this

  const MAX_SIZE = maxSizeMB * 1024 * 1024;

  // Resolve aspect ratio value
  const resolvedAspect =
    typeof aspectRatio === "string"
      ? ASPECT_RATIOS[aspectRatio] ?? ASPECT_RATIOS.landscape
      : aspectRatio;

  // ------------------------------------------------------
  // HANDLE DROPFILE → open crop UI
  // ------------------------------------------------------
  const handleDrop = (files: File[]) => {
    const file = files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      alert(`File too large! Limit: ${maxSizeMB}MB`);
      return;
    }

    setRawFile(file);
    setCroppedImage(null);
  };

  // ------------------------------------------------------
  // APPLY CROPPED IMAGE → upload or preview
  // ------------------------------------------------------
  const handleCropFinish = async (base64: string) => {
    setCroppedImage(base64);

    // convert base64 → file
    const file = base64ToFile(base64, rawFile?.name || "image.png");
    setCroppedFile(file); // <-- store for upload
    // Do not close dialog here
  };

  // Upload cropped image to Supabase Storage
  const handleSupabaseUpload = async () => {
    if (!croppedFile) {
      return;
    }
    setUploading(true);
    try {
      const filePath = `public/thumbnails/${Date.now()}_${croppedFile.name}`;
      const { data, error } = await supabase.storage
        .from(IMAGE_BUCKET) // <-- replace with your bucket
        .upload(filePath, croppedFile, { upsert: true });
      if (error) throw error;
      // Get public URL
      const { data: urlData } = supabase.storage
        .from(IMAGE_BUCKET)
        .getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) throw new Error("Failed to get public URL");
      onChange(publicUrl, croppedFile);
      closeDialog();
    } catch (err) {
      alert("Upload failed: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  // ------------------------------------------------------
  // REMOVE IMAGE
  // ------------------------------------------------------
  const resetAll = () => {
    setRawFile(null);
    setCroppedImage(null);
    onChange("");

    if (fileInputRef.current) fileInputRef.current.value = "";
    closeDialog();
  };

  // ------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------
  const base64ToFile = (base64: string, filename: string): File | null => {
    try {
      const arr = base64.split(",");
      const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      return new File([u8arr], filename, { type: mime });
    } catch {
      return null;
    }
  };

  // Open dialog when user clicks trigger
  const openDialog = () => {
    setDialogOpen(true);
  };
  // Close dialog on cancel, reset, or upload success
  const closeDialog = () => {
    setDialogOpen(false);
    setRawFile(null);
    setCroppedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-1">{label}</label>
      )}

      {/* Preview or trigger */}
      {value || croppedImage ? (
        <div className="flex flex-col gap-3">
          {/* Only render Image if src is a valid non-empty string */}
          {croppedImage || value ? (
            <img
              src={croppedImage || value || undefined}
              alt="Preview"
              className="rounded-md border object-cover w-1/2"
            />
          ) : null}
          <div className="flex items-center gap-3 w-full">
            <Button
              type="button"
              variant="destructive"
              onClick={resetAll}
              disabled={uploading}
            >
              <XIcon className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={openDialog}
              disabled={disabled || uploading}
            >
              Change
            </Button>
          </div>
          {uploading && <UploadCloud className="animate-spin w-5 h-5" />}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={openDialog}
          disabled={disabled || uploading}
          className="flex items-center gap-2 h-32 w-full justify-center bg-input"
        >
          <ImageIcon className="w-5 h-5" />
          Upload Image
        </Button>
      )}

      {/* Dialog for image upload/crop */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {/* Constrain dialog to viewport and center content; enable internal scrolling */}
        <DialogContent className="sm:max-w-[90vw] w-fit max-h-[85vh] overflow-auto flex flex-col items-center gap-4 p-4" disableOutsideClose showCloseButton={true}>
          <DialogTitle className="sr-only">Image Upload</DialogTitle>

          {/* 1. NO FILE → SHOW DROPZONE */}
          {!rawFile && (
            <div className="w-full ">
              <Dropzone
                className="w-full h-96 min-w-lg p-6"
                accept={{ "image/*": [] }}
                maxFiles={1}
                onDrop={(f) => handleDrop(f)}
              >
                <DropzoneEmptyState />
              </Dropzone>
            </div>
          )}

          {/* 2. CROPPER UI */}
          {rawFile && !croppedImage && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="w-full ">
                <ImageCrop
                  file={rawFile}
                  aspect={resolvedAspect}
                  maxImageSize={MAX_SIZE}
                  onCrop={handleCropFinish}
                >
                  {/* Put both the crop canvas and the control buttons inside the provider */}
                  <div className="flex flex-col items-center gap-4">
                    <ImageCropContent className="border rounded-lg mx-auto" />

                    <div className="flex flex-wrap gap-2 items-center justify-center w-full max-w-[1100px]">
                      <ImageCropApply />
                      <ImageCropReset />
                      <Button variant="outline" size="sm" onClick={resetAll}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </ImageCrop>
              </div>
            </div>
          )}

          {/* 3. After crop, show preview and upload button */}
          {croppedImage && croppedFile && (
            <div className="flex flex-col items-center gap-4 w-full ">
              {/* Thumbnails: keep small to avoid pushing layout */}
              {croppedImage ? (
                <img
                  src={croppedImage}
                  alt="Cropped Preview"
                  className="rounded-md border object-cover"
                  // style={{ width: 240, height: "auto", maxWidth: "100%" }}
                />
              ) : null}
              <div className="flex w-full gap-2 flex-col md:flex-row justify-center">
                <Button onClick={handleSupabaseUpload} disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload Image"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={closeDialog}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden file input for manual trigger (optional, can be removed if not needed) */}
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          if (!e.target.files?.[0]) return;
          handleDrop([e.target.files[0]]);
        }}
      />
    </div>
  );
}
