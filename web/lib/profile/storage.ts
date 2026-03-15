import type { Accept } from "react-dropzone"

// Default public bucket used for profile avatar uploads.
export const PROFILE_IMAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_PROFILE_IMAGE_BUCKET ?? "profile-images"

// Maximum avatar file size accepted by the uploader.
export const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

export const PROFILE_IMAGE_ACCEPT: Accept = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
}

export function createProfileImagePath(userId: string, file: File) {
  const originalExtension = file.name.split(".").pop()?.toLowerCase()
  const extension =
    originalExtension && originalExtension.length <= 5
      ? originalExtension
      : "png"

  return `profiles/${userId}/avatar-${Date.now()}-${crypto.randomUUID()}.${extension}`
}
