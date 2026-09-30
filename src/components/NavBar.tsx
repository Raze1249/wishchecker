"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SessionUser } from "@/server/auth/auth";

export default function NavBar({ user }: { user: SessionUser | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const links = [
    { href: "/analyze", label: "Analyze" },
    { href: "/search", label: "Search" },
    { href: "/how-it-works", label: "How it works" },
    { href: "/about", label: "About" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-white">🛡️</span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            Trust<span className="text-emerald-600">Graph</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-slate-600 hover:text-slate-900">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  Admin
                </Link>
              )}
              <button onClick={logout} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Sign in
              </Link>
              <Link href="/register" className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800">
                Create account
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          <span className="text-2xl">☰</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-1 text-sm font-medium text-slate-700">
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)} className="py-1 text-sm font-medium text-slate-700">
                  Dashboard
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin" onClick={() => setOpen(false)} className="py-1 text-sm font-medium text-slate-700">
                    Admin
                  </Link>
                )}
                <button onClick={logout} className="py-1 text-left text-sm font-medium text-slate-700">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="py-1 text-sm font-medium text-slate-700">
                  Sign in
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className="py-1 text-sm font-medium text-emerald-700">
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
