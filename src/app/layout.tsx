import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from '@/components/layout/navbar'
import { siteConfig } from '@/lib/config'
import { Toaster } from '@/components/ui/sonner'
import { AuthGuard } from "@/components/auth/auth-guard"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <AuthGuard>
          <Navbar />
          {children}
          <Toaster />
        </AuthGuard>
      </body>
    </html>
  );
}
