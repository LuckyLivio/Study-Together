import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from '@/components/layout/navbar'
import { siteConfig } from '@/lib/config'
import { Toaster } from '@/components/ui/sonner'
import { AuthGuard } from "@/components/auth/auth-guard"
import { ThemeWrapper } from '@/components/layout/theme-wrapper'
import { MessageNotificationProvider } from '@/components/notifications/message-notification'

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
          <ThemeWrapper>
            <MessageNotificationProvider>
              <Navbar />
              {children}
              <Toaster />
            </MessageNotificationProvider>
          </ThemeWrapper>
        </AuthGuard>
      </body>
    </html>
  );
}
