"use client"

import { useState } from "react"

import { createClient } from "@/lib/supabase/client"
import {
  createProfileImagePath,
  PROFILE_IMAGE_BUCKET,
} from "@/lib/profile/storage"

export function useSupabaseUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  function clearUploadError() {
    setUploadError(null)
  }

  async function uploadProfileImage(userId: string, file: File) {
    setIsUploading(true)
    setUploadError(null)

    try {
      const supabase = createClient()
      const path = createProfileImagePath(userId, file)
      const { error } = await supabase.storage
        .from(PROFILE_IMAGE_BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        })

      if (error) {
        throw error
      }

      const { data } = supabase.storage
        .from(PROFILE_IMAGE_BUCKET)
        .getPublicUrl(path)

      return {
        path,
        publicUrl: data.publicUrl,
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "画像のアップロードに失敗しました。"

      setUploadError(`画像のアップロードに失敗しました。${message}`)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  return {
    clearUploadError,
    isUploading,
    uploadError,
    uploadProfileImage,
  }
}
