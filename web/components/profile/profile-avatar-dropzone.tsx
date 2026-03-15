"use client"

import { useEffect, useState } from "react"
import { ImagePlus, LoaderCircle, Trash2, UploadCloud } from "lucide-react"
import { useDropzone, type FileRejection } from "react-dropzone"

import { cn } from "@/lib/utils"
import {
  MAX_PROFILE_IMAGE_SIZE_BYTES,
  PROFILE_IMAGE_ACCEPT,
} from "@/lib/profile/storage"
import { useSupabaseUpload } from "@/hooks/use-supabase-upload"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"

interface ProfileAvatarDropzoneProps {
  disabled?: boolean
  onChange: (value: string) => void
  onUploadingChange?: (value: boolean) => void
  userId: string
  value: string
}

function toDropzoneErrorMessage(rejections: FileRejection[]) {
  const firstError = rejections[0]?.errors[0]

  switch (firstError?.code) {
    case "file-too-large":
      return "画像は5MB以下にしてください。"
    case "file-invalid-type":
      return "PNG / JPG / WebP の画像を選択してください。"
    case "too-many-files":
      return "画像は1枚だけ選択できます。"
    default:
      return "画像をアップロードできませんでした。"
  }
}

export function ProfileAvatarDropzone({
  disabled = false,
  onChange,
  onUploadingChange,
  userId,
  value,
}: ProfileAvatarDropzoneProps) {
  const [clientError, setClientError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const { clearUploadError, isUploading, uploadError, uploadProfileImage } =
    useSupabaseUpload()

  useEffect(() => {
    onUploadingChange?.(isUploading)
  }, [isUploading, onUploadingChange])

  const { getInputProps, getRootProps, isDragActive, isDragReject, open } =
    useDropzone({
      accept: PROFILE_IMAGE_ACCEPT,
      disabled,
      maxFiles: 1,
      maxSize: MAX_PROFILE_IMAGE_SIZE_BYTES,
      multiple: false,
      noClick: true,
      onDropAccepted: async (files) => {
        const file = files[0]

        if (!file) {
          return
        }

        setClientError(null)
        setStatusMessage(null)
        clearUploadError()

        const uploaded = await uploadProfileImage(userId, file)

        if (!uploaded) {
          return
        }

        onChange(uploaded.publicUrl)
        setStatusMessage("画像をアップロードしました。保存すると反映されます。")
      },
      onDropRejected: (rejections) => {
        setStatusMessage(null)
        setClientError(toDropzoneErrorMessage(rejections))
      },
    })

  const errorMessage = clientError ?? uploadError

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "rounded-[28px] border border-dashed border-border/80 bg-muted/20 p-5 transition-colors",
          isDragActive && "border-primary bg-primary/5",
          isDragReject && "border-destructive/60 bg-destructive/5",
          errorMessage && "border-destructive/60 bg-destructive/5",
          disabled && "cursor-not-allowed opacity-70"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border border-border/80 bg-card shadow-sm">
            {value ? (
              <div
                aria-label="プロフィール画像のプレビュー"
                role="img"
                className="size-full bg-cover bg-center"
                style={{
                  backgroundImage: `url("${value}")`,
                }}
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
                <ImagePlus className="size-7" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              {isUploading ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <UploadCloud className="size-4" />
              )}
              <span>
                {isUploading
                  ? "画像をアップロードしています..."
                  : isDragActive
                    ? "ここにドロップしてアイコンを設定"
                    : "ドラッグ&ドロップでアイコンを追加"}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              PNG / JPG / WebP に対応しています。プロフィール画面と
              オンボーディングの両方で同じアイコンを使えます。
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || isUploading}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  open()
                }}
              >
                画像を選ぶ
              </Button>
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled || isUploading}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    setClientError(null)
                    setStatusMessage(null)
                    clearUploadError()
                    onChange("")
                  }}
                >
                  <Trash2 className="size-4" />
                  画像を外す
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {statusMessage && !errorMessage ? (
        <p className="text-sm text-muted-foreground">{statusMessage}</p>
      ) : null}
      {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
    </div>
  )
}
