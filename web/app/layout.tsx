import { BIZ_UDPGothic, Geist_Mono } from "next/font/google"
import "@xyflow/react/dist/style.css"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const biz_udpgothic = BIZ_UDPGothic({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400"],
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        biz_udpgothic.variable
      )}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
