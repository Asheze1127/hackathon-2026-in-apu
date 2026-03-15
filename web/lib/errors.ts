import { ZodError } from "zod"

export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NODE_NOT_FOUND"
  | "FORBIDDEN"
  | "PROFILE_NOT_FOUND"
  | "INTERNAL_ERROR"

export interface ErrorResponse {
  error: {
    code: AppErrorCode
    message: string
  }
}

export type ActionResponse<T> = T | ErrorResponse

export class AppActionError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string
  ) {
    super(message)
    this.name = "AppActionError"
  }
}

export function toErrorResponse(
  code: AppErrorCode,
  message: string
): ErrorResponse {
  return {
    error: {
      code,
      message,
    },
  }
}

export function mapUnknownToErrorResponse(
  error: unknown,
  fallbackMessage: string
): ErrorResponse {
  if (error instanceof AppActionError) {
    return toErrorResponse(error.code, error.message)
  }

  if (error instanceof ZodError) {
    return toErrorResponse(
      "VALIDATION_ERROR",
      error.issues[0]?.message ?? "入力値が不正です。"
    )
  }

  return toErrorResponse("INTERNAL_ERROR", fallbackMessage)
}

export function mapUnknownToAppActionError(
  error: unknown,
  fallbackMessage: string
): AppActionError {
  if (error instanceof AppActionError) {
    return error
  }

  if (error instanceof ZodError) {
    return new AppActionError(
      "VALIDATION_ERROR",
      error.issues[0]?.message ?? "入力値が不正です。"
    )
  }

  return new AppActionError("INTERNAL_ERROR", fallbackMessage)
}
