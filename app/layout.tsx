import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
})

export const metadata: Metadata = {
  title: "Sakshi Dwivedi - QA Automation Engineer",
  description:
    "QA Automation Engineer / SDET with 3+ years of experience in test automation, Selenium, TestNG, RestAssured, and CI/CD. Building reliable, high-quality software.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
