import { cn } from "@/lib/utils"

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-4xl flex-col gap-10 px-8 py-12",
        className
      )}
    >
      {children}
    </div>
  )
}
