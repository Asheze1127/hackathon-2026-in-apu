import { redirect } from "next/navigation"

import { getProfile } from "@/lib/supabase/server"

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getProfile()
  if (user?.onboarded) {
    redirect("/")
  }
  return <>{children}</>
}
