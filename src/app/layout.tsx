import type { Metadata } from "next";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";
import { Building2, LayoutDashboard, ShieldCheck, UserCheck, Smartphone } from "lucide-react";

export const metadata: Metadata = {
  title: "HotelXchange | Smarter Operations. Happier Guests.",
  description: "Guest service request intake and hotel operations workflow platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased" suppressHydrationWarning>
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-40 h-10 flex items-center">
                {/* Fallback branded text if logo missing */}
                <span className="text-xl font-bold tracking-tight text-[#0A4D7E]">
                  Hotel<span className="text-[#B89759]">X</span>change
                </span>
              </div>
              <span className="hidden md:inline-block text-xs text-slate-500 border-l border-slate-200 pl-3">
                Smarter Operations. Happier Guests.
              </span>
            </Link>

            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/guest/room/room-101-demo"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Guest Portal</span>
              </Link>
              <Link
                href="/staff"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <UserCheck className="w-4 h-4 text-[#0A4D7E]" />
                <span className="hidden sm:inline">Staff Queue</span>
              </Link>
              <Link
                href="/supervisor"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">Supervisor</span>
              </Link>
              <Link
                href="/operations"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Operations</span>
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Building2 className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          <p>© 2026 HotelXchange. Smarter Operations. Happier Guests. (Single-Property Pilot Baseline)</p>
        </footer>
      </body>
    </html>
  );
}
