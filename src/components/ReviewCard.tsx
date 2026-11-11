"use client";

import { useState } from "react";
import { CheckCircle2, Flag, ShieldCheck, ThumbsDown, ThumbsUp, XCircle, X, AlertTriangle } from "lucide-react";
import { CompanyReview, ReportReason } from "@/types/database";
import { RatingStars } from "./RatingStars";

interface ReviewCardProps {
  review: CompanyReview;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count);
  const [isMarkedHelpful, setIsMarkedHelpful] = useState(false);

  // State cho Modal báo cáo
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("fake_news");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleToggleHelpful = () => {
    if (isMarkedHelpful) {
      setHelpfulCount((prev) => prev - 1);
      setIsMarkedHelpful(false);
    } else {
      setHelpfulCount((prev) => prev + 1);
      setIsMarkedHelpful(true);
    }
  };

  const handleOpenReport = () => {
    setIsReportOpen(true);
    setReportSuccess(false);
    setReportError(null);
  };

  const handleCloseReport = () => {
    setIsReportOpen(false);
    setReportDetails("");
    setReportError(null);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    setReportError(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_id: review.id,
          company_id: review.company_id,
          reason: reportReason,
          details: reportDetails.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReportError(data.error || "Gửi báo cáo thất bại.");
        setIsSubmittingReport(false);
        return;
      }

      setReportSuccess(true);
      setIsSubmittingReport(false);
    } catch (err) {
      setReportError("Lỗi kết nối: " + (err instanceof Error ? err.message : "Thử lại sau."));
      setIsSubmittingReport(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              {review.job_title}
            </h4>
            {review.verification_level === 2 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Đã xác minh làm việc
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            {review.employment_status === "current" ? "Đang làm việc tại đây" : "Cựu nhân viên"}{" "}
            {review.working_period && `• Thời gian: ${review.working_period}`}
          </p>
        </div>

        {/* Khuyên bạn bè nên / không nên làm */}
        <div
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${
            review.recommend_to_friend
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
          }`}
        >
          {review.recommend_to_friend ? (
            <>
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>Khuyên nên vào làm</span>
            </>
          ) : (
            <>
              <ThumbsDown className="h-3.5 w-3.5" />
              <span>Không khuyên vào làm</span>
            </>
          )}
        </div>
      </div>

      {/* Ratings Grid */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-800/60">
        <div>
          <span className="text-zinc-500">Lương & Đãi ngộ:</span>
          <div className="mt-0.5">
            <RatingStars rating={review.score_salary} size="sm" />
          </div>
        </div>
        <div>
          <span className="text-zinc-500">Văn hóa & Môi trường:</span>
          <div className="mt-0.5">
            <RatingStars rating={review.score_culture} size="sm" />
          </div>
        </div>
        <div>
          <span className="text-zinc-500">Cân bằng cuộc sống:</span>
          <div className="mt-0.5">
            <RatingStars rating={review.score_wlb} size="sm" />
          </div>
        </div>
        <div>
          <span className="text-zinc-500">Ban lãnh đạo:</span>
          <div className="mt-0.5">
            <RatingStars rating={review.score_management} size="sm" />
          </div>
        </div>
      </div>

      {/* Core: Điểm tốt (Pros) */}
      <div className="mt-4 rounded-lg border-l-4 border-emerald-500 bg-emerald-50/50 p-3.5 text-xs text-zinc-800 dark:bg-emerald-950/20 dark:text-zinc-200">
        <p className="font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1.5 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Điểm tốt (Ưu điểm):
        </p>
        <p className="mt-1.5 leading-relaxed">{review.pros}</p>
      </div>

      {/* Core: Điểm xấu (Cons) */}
      <div className="mt-3 rounded-lg border-l-4 border-rose-500 bg-rose-50/50 p-3.5 text-xs text-zinc-800 dark:bg-rose-950/20 dark:text-zinc-200">
        <p className="font-bold text-rose-700 uppercase tracking-wide flex items-center gap-1.5 dark:text-rose-400">
          <XCircle className="h-3.5 w-3.5" />
          Điểm xấu / Cần cải thiện (Nhược điểm):
        </p>
        <p className="mt-1.5 leading-relaxed">{review.cons}</p>
      </div>

      {/* Lời khuyên cho ban lãnh đạo */}
      {review.advice_to_management && (
        <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-800">
          <p className="font-semibold text-zinc-600 dark:text-zinc-400">
            Lời khuyên cho ban lãnh đạo:
          </p>
          <p className="mt-1 italic leading-relaxed">&ldquo;{review.advice_to_management}&rdquo;</p>
        </div>
      )}

      {/* Footer / Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <button
          onClick={handleToggleHelpful}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            isMarkedHelpful
              ? "bg-red-50 text-red-600 dark:bg-red-950/50"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          <ThumbsUp className={`h-3.5 w-3.5 ${isMarkedHelpful ? "fill-red-600" : ""}`} />
          <span>Hữu ích ({helpfulCount})</span>
        </button>

        <button
          onClick={handleOpenReport}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Báo cáo thông tin sai sự thật hoặc vi phạm chính sách"
        >
          <Flag className="h-3 w-3" />
          <span>Báo cáo</span>
        </button>
      </div>

      {/* Modal Báo cáo vi phạm */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    Báo cáo đánh giá vi phạm
                  </h3>
                  <p className="text-[11px] text-zinc-400">ID: {review.id}</p>
                </div>
              </div>
              <button
                onClick={handleCloseReport}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="mt-3 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Đã tiếp nhận báo cáo
                </h4>
                <p className="mt-1.5 text-xs text-zinc-500 max-w-xs mx-auto">
                  Cảm ơn bạn. Báo cáo đã được lưu vào hệ thống kiểm duyệt Supabase để ban quản trị đối chiếu và xử lý.
                </p>
                <button
                  type="button"
                  onClick={handleCloseReport}
                  className="mt-5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="mt-4 space-y-4">
                {reportError && (
                  <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900">
                    {reportError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                    Lý do báo cáo:
                  </label>
                  <div className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
                    {[
                      { id: "fake_news", label: "Thông tin sai sự thật / Bịa đặt hoàn toàn" },
                      { id: "defamation", label: "Bôi nhọ, xúc phạm, công kích cá nhân đích danh" },
                      { id: "confidential_leak", label: "Tiết lộ bí mật kinh doanh / Tài liệu bảo mật" },
                      { id: "spam", label: "Spam, quảng cáo, chèo kéo dịch vụ" },
                      { id: "harassment", label: "Ngôn từ thù hận, quấy rối hoặc thô tục" },
                      { id: "other", label: "Lý do khác" },
                    ].map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-center gap-2 rounded-lg border p-2 cursor-pointer transition-colors ${
                          reportReason === item.id
                            ? "border-red-600 bg-red-50/50 text-red-950 dark:border-red-500 dark:bg-red-950/20 dark:text-red-200"
                            : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="reportReason"
                          value={item.id}
                          checked={reportReason === item.id}
                          onChange={() => setReportReason(item.id as ReportReason)}
                          className="text-red-600 focus:ring-red-500"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    Mô tả chi tiết (Tùy chọn):
                  </label>
                  <textarea
                    rows={2}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Cung cấp thêm thông tin chứng minh vi phạm (nếu có)..."
                    className="w-full rounded-lg border border-zinc-300 p-2 text-xs text-zinc-900 focus:border-red-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={handleCloseReport}
                    className="rounded-lg px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReport}
                    className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isSubmittingReport ? "Đang gửi..." : "Gửi báo cáo"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
