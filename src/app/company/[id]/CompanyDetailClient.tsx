"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Building2, 
  MapPin, 
  PlusCircle, 
  ArrowLeft, 
  ThumbsUp, 
  Filter
} from "lucide-react";
import { CompanyMetrics, CompanyReview } from "@/types/database";
import { RatingStars } from "@/components/RatingStars";
import { ReviewCard } from "@/components/ReviewCard";

interface CompanyDetailClientProps {
  initialCompany: CompanyMetrics;
  initialReviews: CompanyReview[];
}

export default function CompanyDetailClient({
  initialCompany: company,
  initialReviews: reviews,
}: CompanyDetailClientProps) {
  const [sortBy, setSortBy] = useState<"newest" | "helpful">("newest");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Lọc và sắp xếp review
  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    if (statusFilter === "current") {
      result = result.filter((r) => r.employment_status === "current");
    } else if (statusFilter === "former") {
      result = result.filter((r) => r.employment_status === "former");
    } else if (statusFilter === "recommended") {
      result = result.filter((r) => r.recommend_to_friend === true);
    } else if (statusFilter === "not_recommended") {
      result = result.filter((r) => r.recommend_to_friend === false);
    }

    if (sortBy === "helpful") {
      result.sort((a, b) => b.helpful_count - a.helpful_count);
    } else {
      result.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return result;
  }, [reviews, statusFilter, sortBy]);

  return (
    <div className="min-h-screen bg-zinc-50/60 pb-16 dark:bg-zinc-950">
      {/* Top Breadcrumb & Actions */}
      <div className="border-b border-zinc-200 bg-white py-3 px-4 sm:px-6 lg:px-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại danh sách công ty</span>
          </Link>

          <Link
            href={`/review/new?company_id=${company.company_id}`}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Viết review công ty này</span>
          </Link>
        </div>
      </div>

      {/* Company Header & Score Overview */}
      <div className="border-b border-zinc-200 bg-white py-8 px-4 sm:px-6 lg:px-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 font-extrabold text-2xl dark:bg-zinc-800 dark:text-zinc-200">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-zinc-900 sm:text-3xl dark:text-zinc-100">
                  {company.company_name}
                </h1>
                <p className="mt-1 text-sm text-zinc-500 font-medium">
                  {company.industry}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                    {company.district}, {company.province}
                  </span>
                  <span>•</span>
                  <span>{company.total_reviews} lượt đánh giá</span>
                </div>
              </div>
            </div>

            {/* Score & Recommendation box */}
            <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
              <div>
                <span className="text-xs text-zinc-500 font-medium">Điểm tổng thể</span>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                    {company.overall_rating.toFixed(1)}
                  </span>
                  <RatingStars rating={company.overall_rating} showNumber={false} size="md" />
                </div>
              </div>
              <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-700" />
              <div>
                <span className="text-xs text-zinc-500 font-medium">Khuyên vào làm</span>
                <div className="mt-1 flex items-center gap-1 text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{company.recommend_rate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-zinc-100 pt-6 dark:border-zinc-800">
            <div className="rounded-lg bg-zinc-50 p-3.5 dark:bg-zinc-800/40">
              <span className="text-xs text-zinc-400">Lương & Đãi ngộ</span>
              <p className="mt-1 text-base font-bold text-zinc-800 dark:text-zinc-200">
                {company.avg_salary_score.toFixed(1)} / 5.0 ★
              </p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-3.5 dark:bg-zinc-800/40">
              <span className="text-xs text-zinc-400">Môi trường & Văn hóa</span>
              <p className="mt-1 text-base font-bold text-zinc-800 dark:text-zinc-200">
                {company.avg_culture_score.toFixed(1)} / 5.0 ★
              </p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-3.5 dark:bg-zinc-800/40">
              <span className="text-xs text-zinc-400">Cân bằng cuộc sống (WLB)</span>
              <p className="mt-1 text-base font-bold text-zinc-800 dark:text-zinc-200">
                {company.avg_wlb_score.toFixed(1)} / 5.0 ★
              </p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-3.5 dark:bg-zinc-800/40">
              <span className="text-xs text-zinc-400">Ban lãnh đạo & Quản lý</span>
              <p className="mt-1 text-base font-bold text-zinc-800 dark:text-zinc-200">
                {company.avg_management_score.toFixed(1)} / 5.0 ★
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="space-y-4">
          {/* Filter and Sort Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Lọc theo:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white py-1 px-2.5 text-xs text-zinc-800 shadow-sm focus:border-red-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <option value="all">Tất cả đánh giá ({reviews.length})</option>
                <option value="current">Nhân viên hiện tại</option>
                <option value="former">Cựu nhân viên</option>
                <option value="recommended">Khuyên nên vào làm</option>
                <option value="not_recommended">Không khuyên vào làm</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-400">Sắp xếp:</span>
              <button
                onClick={() => setSortBy("newest")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  sortBy === "newest"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                Mới nhất
              </button>
              <button
                onClick={() => setSortBy("helpful")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  sortBy === "helpful"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                Hữu ích nhất
              </button>
            </div>
          </div>

          {/* Reviews List */}
          {filteredReviews.length > 0 ? (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700 bg-white dark:bg-zinc-900">
              <p className="text-xs text-zinc-500">
                {reviews.length === 0
                  ? "Chưa có đánh giá nào cho công ty này. Hãy là người đầu tiên chia sẻ trải nghiệm!"
                  : "Chưa có đánh giá nào phù hợp với bộ lọc hiện tại."}
              </p>
              {reviews.length === 0 && (
                <div className="mt-3.5">
                  <Link
                    href={`/review/new?company_id=${company.company_id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Viết review đầu tiên</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
