import {
  CheckCircle,
  Calendar,
  MapPin,
  Briefcase,
  GitBranch,
  ArrowRight,
  MessageSquare,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ProfileCardProps {
  avatarText: string
  name: string
  role: string
  age: string
  location: string
  years: string
  branchFrom: string
  branchTo: string
  chatHref: string
}

export function ProfileCard({
  avatarText,
  name,
  role,
  age,
  location,
  years,
  branchFrom,
  branchTo,
  chatHref,
}: ProfileCardProps) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary">
            <span className="text-2xl font-bold text-primary-foreground">
              {avatarText}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xl font-bold">{name}</span>
              <div className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1">
                <CheckCircle size={12} className="text-green-600" />
                <span className="text-[11px] font-bold text-green-700">
                  高一致
                </span>
              </div>
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">{role}</div>
            <div className="mt-1.5 flex flex-wrap gap-3">
              {[
                { Icon: Calendar, text: age },
                { Icon: MapPin, text: location },
                { Icon: Briefcase, text: years },
              ].map(({ Icon, text }, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1 text-muted-foreground"
                >
                  <Icon size={12} />
                  <span className="text-xs">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1">
            <GitBranch size={12} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">
              {branchFrom}
            </span>
          </div>
          <ArrowRight size={12} className="text-muted-foreground" />
          <div className="rounded-lg bg-muted px-2.5 py-1">
            <span className="text-xs font-medium">{branchTo}</span>
          </div>
        </div>

        <Button asChild className="w-full gap-2" size="sm">
          <Link href={chatHref}>
            <MessageSquare size={15} />
            DMを送る
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
