import Link from "next/link";
import { Compass, Home, PlusCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-zinc-50/60 px-4 py-16 dark:bg-zinc-950">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-red-600 shadow-sm dark:bg-red-950/40 dark:text-red-400 border border-red-100 dark:border-red-900/50">
          <Compass className="h-10 w-10 animate-pulse" />
        </div>

        <span className="mt-6 inline-block text-xs font-black tracking-widest text-red-600 uppercase">
          Lỗi 404
        </span>

        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-100">
          Không tìm thấy trang
        </h1>

        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Đường dẫn bạn đang truy cập không tồn tại, đã bị đổi tên hoặc mã công ty không hợp lệ trên hệ thống LinkedOut.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 transition-colors dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Home className="h-4 w-4" />
            <span>Về trang chủ</span>
          </Link>

          <Link
            href="/review/new"
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Viết review công ty</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
