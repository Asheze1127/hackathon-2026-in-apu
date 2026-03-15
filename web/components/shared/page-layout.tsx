import { cn } from "@/lib/utils"

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-2xl flex-col gap-10 px-8 py-24",
        className
      )}
    >
      {children}
    </div>
  )
}
