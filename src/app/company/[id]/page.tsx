import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import CompanyDetailClient from "./CompanyDetailClient";
import { getCompanyById, getReviewsByCompanyId } from "@/lib/store";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const decodedId = decodeURIComponent(id || "");
  const company = await getCompanyById(decodedId);

  if (!company) {
    return {
      title: "Không tìm thấy công ty — LinkedOut",
      description: "Công ty không tồn tại hoặc chưa có dữ liệu đánh giá trên LinkedOut.",
    };
  }

  return {
    title: `${company.company_name} — Đánh giá, Điểm tốt & Điểm xấu | LinkedOut`,
    description: `Xem tổng hợp ${company.total_reviews} review ẩn danh về lương thưởng, môi trường và văn hóa tại ${company.company_name} (${company.district}, ${company.province}).`,
  };
}

async function CompanyContent({ params }: PageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id || "");
  const company = await getCompanyById(decodedId);

  if (!company) {
    return (
      <div className="min-h-screen bg-zinc-50/60 pb-16 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 bg-white py-3 px-4 sm:px-6 lg:px-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại danh sách công ty</span>
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
            Không tìm thấy thông tin công ty
          </h1>
          <p className="mt-2 text-xs text-zinc-500 max-w-md mx-auto">
            Công ty này hiện chưa có dữ liệu trong hệ thống hoặc đường dẫn không chính xác.
            Bạn đang làm việc hoặc từng làm việc tại đây? Hãy là người đầu tiên chia sẻ review!
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              ← Về trang chủ
            </Link>
            <Link
              href={`/review/new?company_id=${encodeURIComponent(decodedId)}`}
              className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
            >
              Viết review cho công ty này
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const reviews = await getReviewsByCompanyId(decodedId);
  return <CompanyDetailClient initialCompany={company} initialReviews={reviews} />;
}

export default function CompanyPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50/60 flex items-center justify-center text-xs text-zinc-500 dark:bg-zinc-950">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
            <span>Đang tải thông tin công ty từ database...</span>
          </div>
        </div>
      }
    >
      <CompanyContent params={params} />
    </Suspense>
  );
}
