"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle, 
  ShieldCheck, 
  ThumbsUp, 
  ThumbsDown,
  AlertCircle,
  Plus
} from "lucide-react";
import { EmploymentStatus, CompanyMetrics } from "@/types/database";

interface ReviewFormContentProps {
  onResetForm: () => void;
}

function ReviewFormContent({ onResetForm }: ReviewFormContentProps) {
  const searchParams = useSearchParams();
  const initialCompanyId = searchParams.get("company_id") || "";

  // Danh sách công ty thật từ API / database để gợi ý
  const [availableCompanies, setAvailableCompanies] = useState<CompanyMetrics[]>([]);

  // 1. Tên công ty (Tự do, không giới hạn)
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialCompanyId);
  const [isCustomCompany, setIsCustomCompany] = useState(true);
  const [companyProvince, setCompanyProvince] = useState("");
  const [companyDistrict, setCompanyDistrict] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetch("/api/companies")
      .then((res) => res.json())
      .then((data) => {
        if (data.companies && Array.isArray(data.companies)) {
          setAvailableCompanies(data.companies);
          if (initialCompanyId) {
            const found = data.companies.find((c: CompanyMetrics) => c.company_id === initialCompanyId);
            if (found) {
              setCompanySearch(found.company_name);
              setSelectedCompanyId(found.company_id);
              setIsCustomCompany(false);
              setCompanyProvince(found.province);
              setCompanyDistrict(found.district);
              setCompanyIndustry(found.industry);
            }
          }
        }
      })
      .catch((err) => console.error("Lỗi tải danh sách gợi ý công ty:", err));
  }, [initialCompanyId]);

  // 2. Thông tin công việc
  const [jobTitle, setJobTitle] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>("current");
  const [workingPeriod, setWorkingPeriod] = useState("2024 - Hiện tại");

  // 3. Đánh giá 1-5 sao
  const [scoreSalary, setScoreSalary] = useState(4);
  const [scoreCulture, setScoreCulture] = useState(4);
  const [scoreWlb, setScoreWlb] = useState(4);
  const [scoreManagement, setScoreManagement] = useState(4);

  // 4. Cốt lõi: Điểm tốt & Điểm xấu
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [adviceToManagement, setAdviceToManagement] = useState("");
  const [recommendToFriend, setRecommendToFriend] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUploaded, setProofUploaded] = useState<boolean | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ company?: string; jobTitle?: string; province?: string }>({});

  // Suggestions từ database thực
  const matchingSuggestions = availableCompanies.filter((c) =>
    c.company_name.toLowerCase().includes(companySearch.toLowerCase().trim())
  );

  const handleSelectSuggestion = (company: CompanyMetrics) => {
    setSelectedCompanyId(company.company_id);
    setCompanySearch(company.company_name);
    setCompanyProvince(company.province || "");
    setCompanyDistrict(company.district || "");
    setCompanyIndustry(company.industry || "");
    setIsCustomCompany(false);
    setShowSuggestions(false);
  };

  const handleCompanyInputChange = (val: string) => {
    setCompanySearch(val);
    setSelectedCompanyId("");
    setIsCustomCompany(true);
    setShowSuggestions(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const errors: { company?: string; jobTitle?: string; province?: string } = {};
    if (!companySearch.trim()) errors.company = "Vui lòng nhập tên công ty!";
    if (!jobTitle.trim()) errors.jobTitle = "Vui lòng nhập vị trí/chức danh!";
    if (isCustomCompany && !companyProvince.trim()) {
      errors.province = "Vui lòng chọn tỉnh/thành phố!";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        company_id: selectedCompanyId || undefined,
        company_name: companySearch.trim(),
        province: companyProvince,
        district: companyDistrict.trim() || undefined,
        industry: companyIndustry.trim() || undefined,
        job_title: jobTitle.trim(),
        employment_status: employmentStatus,
        working_period: workingPeriod.trim() || undefined,
        score_salary: scoreSalary,
        score_culture: scoreCulture,
        score_wlb: scoreWlb,
        score_management: scoreManagement,
        pros: pros.trim(),
        cons: cons.trim(),
        advice_to_management: adviceToManagement.trim() || undefined,
        recommend_to_friend: recommendToFriend,
      };

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        let msg = json.error || "Gửi review thất bại.";
        if (json.details && typeof json.details === "object") {
          const detailMsgs = Object.entries(json.details)
            .filter(([k]) => k !== "_errors")
            .map(([, v]) => {
              const fieldObj = v as { _errors?: string[] };
              return fieldObj?._errors?.join(", ") || "";
            })
            .filter(Boolean);
          if (detailMsgs.length > 0) msg += `: ${detailMsgs.join("; ")}`;
        }
        setFormError(msg);
        setIsSubmitting(false);
        return;
      }

      if (json.company_id) {
        setSelectedCompanyId(json.company_id);
      }

      // Có đính kèm bằng chứng xác minh: tải lên qua API riêng sau khi
      // review đã được tạo (cần review_id do server trả về).
      if (proofFile && json.review_id) {
        try {
          const fd = new FormData();
          fd.append("review_id", json.review_id);
          fd.append("file", proofFile);
          const vRes = await fetch("/api/reviews/verify", { method: "POST", body: fd });
          setProofUploaded(vRes.ok);
        } catch {
          setProofUploaded(false);
        }
      }

      setIsSubmitting(false);
      setSubmittedSuccess(true);
    } catch (err) {
      setFormError("Lỗi kết nối mạng: " + (err instanceof Error ? err.message : "Thử lại sau."));
      setIsSubmitting(false);
    }
  };

  if (submittedSuccess) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle className="h-10 w-10" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
          Gửi đánh giá thành công!
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Cảm ơn bạn đã đóng góp đánh giá chân thực. Review của bạn được bảo mật <strong>hoàn toàn ẩn danh</strong> và giúp ích rất nhiều cho cộng đồng người lao động.
        </p>
        {proofUploaded === true && (
          <p className="mt-3 inline-block rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 border border-emerald-200">
            Bằng chứng xác minh đã được gửi và đang chờ duyệt. Huy hiệu &ldquo;Đã xác minh làm việc&rdquo; sẽ xuất hiện sau khi admin duyệt.
          </p>
        )}
        {proofUploaded === false && (
          <p className="mt-3 inline-block rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 border border-amber-200">
            Không gửi được bằng chứng xác minh (review vẫn đã được đăng). Vui lòng liên hệ admin để bổ sung.
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onResetForm}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Viết thêm review khác</span>
          </button>
          {selectedCompanyId ? (
            <Link
              href={`/company/${encodeURIComponent(selectedCompanyId)}`}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm"
            >
              Xem trang công ty
            </Link>
          ) : null}
          <Link
            href="/"
            prefetch={false}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/60 pb-16 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 bg-white py-3 px-4 sm:px-6 lg:px-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Hủy & Quay lại</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 mt-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              100% Ẩn danh tuyệt đối
            </div>
            <h1 className="mt-2 text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Review Môi trường & Văn hóa Công ty
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Chia sẻ chân thực về điểm tốt, điểm xấu, lương thưởng và ban lãnh đạo. Không ai biết danh tính của bạn.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Global error banner */}
            {formError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* 1. Tên công ty */}
            <div className="relative">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wide dark:text-zinc-200">
                  1. Công ty đánh giá *
                </label>
                {selectedCompanyId ? (
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 dark:bg-emerald-950/40">
                    ✓ Đã chọn từ hệ thống
                  </span>
                ) : companySearch.trim() ? (
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 dark:bg-blue-950/40">
                    + Công ty mới (sẽ được thêm vào hệ thống)
                  </span>
                ) : null}
              </div>

              <input
                type="text"
                required
                placeholder="Gõ tên công ty (VD: Foster, Yazaki, Nestlé, Vinamilk, công ty tư nhân...)"
                value={companySearch}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => handleCompanyInputChange(e.target.value)}
                className={`mt-1.5 w-full rounded-lg border p-2.5 text-sm text-zinc-900 focus:outline-none dark:text-zinc-100 dark:bg-zinc-800 ${
                  fieldErrors.company
                    ? "border-red-400 focus:border-red-600 dark:border-red-600"
                    : "border-zinc-300 focus:border-red-600 dark:border-zinc-700"
                }`}
              />
              {fieldErrors.company && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.company}</p>
              )}

              {/* Danh sách gợi ý nếu trùng với công ty có sẵn */}
              {showSuggestions && matchingSuggestions.length > 0 && companySearch.trim().length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800 max-h-52 overflow-y-auto">
                  <div className="p-2 text-[11px] font-semibold text-zinc-400 border-b border-zinc-100 dark:border-zinc-700">
                    Công ty gợi ý có sẵn:
                  </div>
                  {matchingSuggestions.map((c) => (
                    <button
                      type="button"
                      key={c.company_id}
                      onClick={() => handleSelectSuggestion(c)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700 flex flex-col border-b border-zinc-50 dark:border-zinc-800 last:border-0"
                    >
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{c.company_name}</span>
                      <span className="text-[11px] text-zinc-500">{c.district}, {c.province} • {c.industry}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Nếu là công ty mới */}
              {isCustomCompany && companySearch.trim().length > 0 && (
                <div className="mt-3 rounded-lg bg-zinc-50 p-3.5 border border-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-700 space-y-3">
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Thông tin thêm về công ty này (để phân loại vùng KCN):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-zinc-500 font-medium">Tỉnh / Thành phố *</label>
                      <select
                        value={companyProvince}
                        required
                        onChange={(e) => setCompanyProvince(e.target.value)}
                        className={`mt-1 w-full rounded border bg-white p-2 text-xs focus:border-red-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 ${
                          !companyProvince
                            ? "text-zinc-400 dark:text-zinc-500 border-zinc-300"
                            : "text-zinc-900 dark:text-zinc-100 border-zinc-300"
                        } ${fieldErrors.province ? "border-red-500 dark:border-red-500" : ""}`}
                      >
                        <option value="" disabled>
                          -- Chọn tỉnh/thành phố --
                        </option>
                        <option value="Bình Dương">Bình Dương</option>
                        <option value="Đồng Nai">Đồng Nai</option>
                        <option value="TP.HCM">TP.HCM</option>
                        <option value="Bà Rịa - Vũng Tàu">Bà Rịa - Vũng Tàu</option>
                        <option value="Long An">Long An</option>
                        <option value="Bắc Ninh">Bắc Ninh</option>
                        <option value="Hải Phòng">Hải Phòng</option>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="Khác">Tỉnh thành khác</option>
                      </select>
                      {fieldErrors.province && (
                        <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                          {fieldErrors.province}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-500 font-medium">Quận / Huyện / KCN</label>
                      <input
                        type="text"
                        placeholder="VD: KCN VSIP 2, KCN Amata..."
                        value={companyDistrict}
                        onChange={(e) => setCompanyDistrict(e.target.value)}
                        className="mt-1 w-full rounded border border-zinc-300 p-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-500 font-medium">Ngành nghề</label>
                      <input
                        type="text"
                        placeholder="VD: Điện tử, Cơ khí, Dệt may..."
                        value={companyIndustry}
                        onChange={(e) => setCompanyIndustry(e.target.value)}
                        className="mt-1 w-full rounded border border-zinc-300 p-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Vị trí & Tình trạng làm việc */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5">
                <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wide dark:text-zinc-200">
                  2. Chức danh công việc *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Kỹ sư QA, Công nhân đứng máy, Kế toán..."
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className={`mt-1.5 w-full rounded-lg border p-2.5 text-sm text-zinc-900 focus:outline-none dark:text-zinc-100 dark:bg-zinc-800 ${
                    fieldErrors.jobTitle
                      ? "border-red-400 focus:border-red-600 dark:border-red-600"
                      : "border-zinc-300 focus:border-red-600 dark:border-zinc-700"
                  }`}
                />
                {fieldErrors.jobTitle && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.jobTitle}</p>
                )}
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wide dark:text-zinc-200">
                  Tình trạng làm việc
                </label>
                <select
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value as EmploymentStatus)}
                  className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white p-2.5 text-sm font-medium text-zinc-900 focus:border-red-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="current">Đang làm việc</option>
                  <option value="former">Đã nghỉ việc</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wide dark:text-zinc-200">
                  Thời gian làm việc
                </label>
                <input
                  type="text"
                  placeholder="VD: 2022 - 2024 hoặc 2 năm"
                  value={workingPeriod}
                  onChange={(e) => setWorkingPeriod(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-zinc-300 p-2.5 text-sm text-zinc-900 focus:border-red-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* 3. Chấm điểm 4 tiêu chí cốt lõi */}
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/40 space-y-4">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wide dark:text-zinc-200">
                3. Đánh giá chất lượng (1 - 5 sao)
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="flex flex-col justify-between h-full">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 min-h-[2.5rem] flex items-start">
                    Lương & Phúc lợi:
                  </span>
                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setScoreSalary(star)}
                        className={`h-7 w-7 rounded-md font-bold text-xs transition-colors ${
                          scoreSalary >= star
                            ? "bg-amber-400 text-white"
                            : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                        }`}
                      >
                        {star}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-between h-full">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 min-h-[2.5rem] flex items-start">
                    Văn hóa & Môi trường:
                  </span>
                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setScoreCulture(star)}
                        className={`h-7 w-7 rounded-md font-bold text-xs transition-colors ${
                          scoreCulture >= star
                            ? "bg-amber-400 text-white"
                            : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                        }`}
                      >
                        {star}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-between h-full">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 min-h-[2.5rem] flex items-start">
                    Cân bằng cuộc sống (WLB):
                  </span>
                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setScoreWlb(star)}
                        className={`h-7 w-7 rounded-md font-bold text-xs transition-colors ${
                          scoreWlb >= star
                            ? "bg-amber-400 text-white"
                            : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                        }`}
                      >
                        {star}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-between h-full">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 min-h-[2.5rem] flex items-start">
                    Ban lãnh đạo & Quản lý:
                  </span>
                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setScoreManagement(star)}
                        className={`h-7 w-7 rounded-md font-bold text-xs transition-colors ${
                          scoreManagement >= star
                            ? "bg-amber-400 text-white"
                            : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                        }`}
                      >
                        {star}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. CỐT LÕI: ĐIỂM TỐT (PROS) */}
            <div>
              <label className="block text-xs font-bold text-emerald-700 uppercase tracking-wide dark:text-emerald-400">
                4. Điểm tốt (Ưu điểm của công ty)
              </label>
              <textarea
                rows={3}
                placeholder="Điều gì bạn thích ở công ty này? (Môi trường, đồng nghiệp, chế độ, thưởng, sếp tốt...)"
                value={pros}
                maxLength={5000}
                onChange={(e) => setPros(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-emerald-300 p-2.5 text-xs text-zinc-900 focus:border-emerald-600 focus:outline-none dark:border-emerald-800 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* 5. CỐT LÕI: ĐIỂM XẤU (CONS) */}
            <div>
              <label className="block text-xs font-bold text-rose-700 uppercase tracking-wide dark:text-rose-400">
                5. Điểm xấu / Mặt hạn chế cần cải thiện
              </label>
              <textarea
                rows={3}
                placeholder="Những mặt chưa tốt hoặc gây khó chịu? (Lương thấp, OT nhiều, áp lực, chế độ...)"
                value={cons}
                maxLength={5000}
                onChange={(e) => setCons(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-rose-300 p-2.5 text-xs text-zinc-900 focus:border-rose-600 focus:outline-none dark:border-rose-800 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* 6. Lời khuyên cho ban lãnh đạo */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wide dark:text-zinc-200">
                6. Lời khuyên cho ban lãnh đạo / Ban giám đốc (Tùy chọn)
              </label>
              <textarea
                rows={2}
                placeholder="Bạn có thông điệp gì gửi gắm đến ban giám đốc để công ty tốt hơn không?"
                value={adviceToManagement}
                maxLength={2000}
                onChange={(e) => setAdviceToManagement(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-zinc-300 p-2.5 text-xs text-zinc-900 focus:border-red-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>

            {/* 7. Khuyên bạn bè vào làm */}
            <div className="rounded-lg border border-zinc-200 p-3.5 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wide dark:text-zinc-200 mb-2">
                7. Bạn có khuyên bạn bè vào làm tại công ty này không?
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <input
                    type="radio"
                    name="recommend"
                    checked={recommendToFriend === true}
                    onChange={() => setRecommendToFriend(true)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <ThumbsUp className="h-4 w-4" />
                  <span>Có, khuyên nên vào làm</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-rose-700 dark:text-rose-400">
                  <input
                    type="radio"
                    name="recommend"
                    checked={recommendToFriend === false}
                    onChange={() => setRecommendToFriend(false)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <ThumbsDown className="h-4 w-4" />
                  <span>Không khuyên vào làm</span>
                </label>
              </div>
            </div>

            {/* 8. Xác minh bằng chứng (Tùy chọn) */}
            <div className="rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Nâng cấp huy hiệu &ldquo;Đã xác minh làm việc&rdquo; (Mức 2)
                  </h4>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Tải lên ảnh Quyết định thôi việc hoặc Thư mời nhận việc (Offer Letter). Hãy che thông tin CCCD và số tài khoản ngân hàng trước khi tải. File sẽ tự hủy sau khi duyệt.
                  </p>
                  
                  <div className="mt-3">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                        setProofFile(f);
                        if (f) {
                          e.target.title = "Đã chọn: " + f.name;
                        }
                      }}
                      className="text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 cursor-pointer"
                    />
                    <p className="mt-1.5 text-[11px] text-zinc-400">File sẽ được xem xét bởi admin và tự hủy sau khi duyệt.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quy tắc & Nút gửi */}
            <div className="border-t border-zinc-200 pt-5 dark:border-zinc-800">
              <div className="flex items-start gap-2 text-[11px] text-zinc-500">
                <AlertCircle className="h-4 w-4 shrink-0 text-zinc-400 mt-0.5" />
                <p>
                  Bằng việc gửi đánh giá, bạn cam kết phản ánh đúng sự thật trải nghiệm cá nhân, không công kích bôi nhọ cá nhân cụ thể và không tiết lộ bí mật thương mại.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-5 w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Đang mã hóa ẩn danh & gửi đánh giá..." : "Gửi đánh giá công ty (Ẩn danh)"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NewReviewPage() {
  const [resetKey, setResetKey] = useState(0);

  const handleReset = () => {
    setResetKey((prev) => prev + 1);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-500">Đang tải biểu mẫu...</div>}>
      <ReviewFormContent key={resetKey} onResetForm={handleReset} />
    </Suspense>
  );
}
