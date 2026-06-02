import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SocketProvider } from "@/components/providers/socket-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TeamCollab - Team Collaboration Platform",
  description: "Everything your team needs in one place. Messaging, documents, spreadsheets, presentations, and task management together.",
  keywords: ["TeamCollab", "collaboration", "messaging", "documents", "tasks", "workspace", "team"],
  authors: [{ name: "TeamCollab" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "TeamCollab - Team Collaboration Platform",
    description: "Everything your team needs in one place.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TeamCollab - Team Collaboration Platform",
    description: "Everything your team needs in one place.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <SocketProvider>
          {children}
        </SocketProvider>
        <Toaster />
      </body>
    </html>
  );
}
