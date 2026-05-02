import type { Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: '#d42c2c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ayam Kalintang - Self Order Kiosk",
  description: "Sistem Pesan Mandiri Ayam Kalintang",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ayam Kalintang",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden selection:bg-[#d42c2c] selection:text-white">
        {children}
      </body>
    </html>
  );
}
