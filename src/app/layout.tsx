import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const geistSans = inter;
const geistMono = inter;

export const metadata: Metadata = {
  title: "Clanplug",
  description: "Clanplug — modern, secure authentication experience",
};

import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import BannedUserModal from '@/components/BannedUserModal';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900`}
      >
        <ToastProvider>
          <AuthProvider>
            <BannedUserModal />
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
