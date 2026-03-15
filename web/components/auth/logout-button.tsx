"use client"

import { useTransition } from "react"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

interface LogoutButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  "children" | "onClick"
> {
  children?: React.ReactNode
}

export function LogoutButton({
  children,
  className,
  disabled,
  size = "default",
  variant = "destructive",
  ...props
}: LogoutButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const logout = () => {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.replace("/auth/login")
      router.refresh()
    })
  }

  return (
    <Button
      {...props}
      type="button"
      className={className}
      disabled={disabled || isPending}
      onClick={logout}
      size={size}
      variant={variant}
    >
      {children ?? (
        <>
          <LogOut className="size-4" />
          {isPending ? "ログアウト中..." : "ログアウト"}
        </>
      )}
    </Button>
  )
}
