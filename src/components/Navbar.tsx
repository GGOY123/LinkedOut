"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white font-black text-xl shadow-sm transition-transform group-hover:scale-105">
            LO
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-zinc-900 dark:text-zinc-100">
              Linked<span className="text-red-600">Out</span>
            </span>
            <span className="text-[10px] -mt-1 font-medium text-zinc-500 tracking-wide">
              Review công ty ẩn danh
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/review/new"
            onClick={(e) => {
              if (typeof window !== "undefined" && window.location.pathname === "/review/new") {
                e.preventDefault();
                window.location.reload();
              }
            }}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Viết review công ty</span>
            <span className="sm:hidden">Viết review</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
