import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  const { data: user } = await supabase.auth.getUser()
  if (error || !data?.claims || !user.user?.id) {
    redirect("/auth/login")
  }

  return <>{children}</>
}
