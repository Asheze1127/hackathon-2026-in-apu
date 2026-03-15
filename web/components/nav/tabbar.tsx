"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Settings, Star } from "lucide-react"

const tabs = [
  { label: "ホーム", href: "/", icon: Home },
  { label: "ロールモデル", href: "/rolemodel", icon: Star },
  { label: "設定", href: "/settings", icon: Settings },
]

export function GraphTabBar() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <nav className="flex items-center gap-1 rounded-full border border-border bg-white/90 px-2 py-1.5 shadow-md backdrop-blur-sm">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
