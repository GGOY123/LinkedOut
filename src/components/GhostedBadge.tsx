import { Ghost } from "lucide-react";

interface GhostedBadgeProps {
  rate: number | null;
  size?: "sm" | "md";
}

export function GhostedBadge({ rate, size = "sm" }: GhostedBadgeProps) {
  if (rate === null || rate === undefined) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        Chưa đủ dữ liệu
      </span>
    );
  }

  // Tỉ lệ bị bơ: Dưới 10% = Xanh (An toàn), 10-25% = Vàng (Cảnh báo), Trên 25% = Đỏ (Báo động)
  let colorStyle = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";

  if (rate >= 25) {
    colorStyle = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
  } else if (rate >= 10) {
    colorStyle = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-md border font-semibold ${colorStyle} ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
      }`}
      title={`${rate}% ứng viên phản ánh không nhận được phản hồi kết quả sau phỏng vấn`}
    >
      <Ghost className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      <span>{rate}% bị &ldquo;bơ&rdquo;</span>
    </div>
  );
}
