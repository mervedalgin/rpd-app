import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RPD Öğrenci Yönlendirme",
  description: "RPD Öğrenci Yönlendirme Uygulaması",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Toaster 
          position="top-right" 
          richColors 
          closeButton
          toastOptions={{
            duration: 3000,
          }}
        />
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-30 border-b border-white/20 bg-white/60 backdrop-blur-md">
            <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-3 md:px-6 text-sm">
              <Link href="/" className="font-semibold tracking-tight text-slate-800 hover:text-blue-600 transition-colors">
                RPD
              </Link>
              <nav className="flex items-center gap-3">
                <Link
                  href="/panel"
                  className="rounded-full border border-blue-500/40 bg-gradient-to-r from-blue-500/80 to-indigo-500/80 px-3 py-1 text-xs font-medium text-white shadow-sm shadow-blue-500/40 hover:shadow-md hover:shadow-blue-500/60 hover:from-blue-600 hover:to-indigo-600 transition-all"
                >
                  Panel
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
