import Link from "next/link";
import { Building2, MapPin, ThumbsUp } from "lucide-react";
import { CompanyMetrics } from "@/types/database";
import { RatingStars } from "./RatingStars";

interface CompanyCardProps {
  company: CompanyMetrics;
}

export function CompanyCard({ company }: CompanyCardProps) {
  const companyId =
    company.company_id ||
    (company as unknown as { id?: string }).id ||
    company.normalized_name;
  return (
    <Link
      href={`/company/${encodeURIComponent(companyId)}`}
      className="group flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 font-bold text-lg dark:bg-zinc-800 dark:text-zinc-300 group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 group-hover:text-red-600 transition-colors line-clamp-1 dark:text-zinc-100">
                {company.company_name}
              </h3>
              <p className="text-xs text-zinc-500 font-medium">{company.industry}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          <span className="line-clamp-1">
            {company.district}, {company.province}
          </span>
        </div>

        {/* Rating & Recommend Rate */}
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <div>
            <span className="text-[11px] text-zinc-400">Đánh giá chung</span>
            <div className="mt-0.5">
              <RatingStars rating={company.overall_rating} size="sm" />
            </div>
          </div>
          <div>
            <span className="text-[11px] text-zinc-400">Khuyên vào làm</span>
            <div className="mt-0.5 flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>{company.recommend_rate}% khuyên làm</span>
            </div>
          </div>
        </div>

        {/* Detail Breakdown */}
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-zinc-50 p-2 text-center text-[11px] text-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-400">
          <div>
            <span className="block text-[10px] text-zinc-400">Lương</span>
            <span className="font-bold text-zinc-800 dark:text-zinc-200">{company.avg_salary_score.toFixed(1)} ★</span>
          </div>
          <div>
            <span className="block text-[10px] text-zinc-400">Văn hóa</span>
            <span className="font-bold text-zinc-800 dark:text-zinc-200">{company.avg_culture_score.toFixed(1)} ★</span>
          </div>
          <div>
            <span className="block text-[10px] text-zinc-400">Cân bằng</span>
            <span className="font-bold text-zinc-800 dark:text-zinc-200">{company.avg_wlb_score.toFixed(1)} ★</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-400 dark:border-zinc-800">
        <span className="font-medium text-zinc-500 dark:text-zinc-400">
          {company.total_reviews} đánh giá từ nhân viên
        </span>
        <span className="font-semibold text-red-600 group-hover:underline">
          Xem chi tiết →
        </span>
      </div>
    </Link>
  );
}
