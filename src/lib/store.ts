import fs from "fs";
import path from "path";
import crypto from "crypto";
import { CompanyMetrics, CompanyReview, ReviewReport, ReportReason, ReviewStatus } from "@/types/database";
import { MOCK_COMPANIES, MOCK_REVIEWS } from "@/data/mockData";

interface DatabaseState {
  companies: CompanyMetrics[];
  reviews: Record<string, CompanyReview[]>;
  reports?: ReviewReport[];
}

const DB_PATH = path.join(process.cwd(), "src", "data", "db.json");

// Đọc dữ liệu từ file JSON, nếu chưa có thì khởi tạo từ MOCK ban đầu
function loadData(): DatabaseState {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Lỗi khi đọc file db.json:", err);
  }

  // Khởi tạo mặc định
  const initialState: DatabaseState = {
    companies: [...MOCK_COMPANIES],
    reviews: { ...MOCK_REVIEWS },
  };

  saveData(initialState);
  return initialState;
}

function saveData(data: DatabaseState): void {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Lỗi khi ghi file db.json:", err);
  }
}

export function getAllCompanies(): CompanyMetrics[] {
  const data = loadData();
  return data.companies;
}

export function getCompanyById(companyId: string): CompanyMetrics | null {
  const data = loadData();
  return data.companies.find((c) => c.company_id === companyId) || null;
}

export function getReviewsByCompanyId(companyId: string, includeHidden = false): CompanyReview[] {
  const data = loadData();
  const reviews = data.reviews[companyId] || [];
  if (includeHidden) {
    return reviews;
  }
  return reviews.filter((r) => !r.status || r.status === "published");
}

export interface CreateReviewInput {
  company_id?: string;
  company_name?: string;
  province?: string;
  district?: string;
  industry?: string;

  job_title: string;
  employment_status: "current" | "former";
  working_period?: string;

  score_salary: number;
  score_culture: number;
  score_wlb: number;
  score_management: number;

  pros: string;
  cons: string;
  advice_to_management?: string;
  recommend_to_friend: boolean;
}

export function saveReview(input: CreateReviewInput): { company: CompanyMetrics; review: CompanyReview } {
  const data = loadData();
  let targetCompany = data.companies.find((c) => c.company_id === input.company_id);

  // Nếu chưa có company_id hoặc tên mới
  if (!targetCompany && input.company_name) {
    const norm = input.company_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    // Tìm xem đã có công ty cùng tên chưa
    targetCompany = data.companies.find((c) => c.normalized_name === norm);

    if (!targetCompany) {
      // Tạo công ty mới
      const newCompanyId = crypto.randomUUID();
      targetCompany = {
        company_id: newCompanyId,
        company_name: input.company_name.trim(),
        normalized_name: norm,
        industry: input.industry || "Chưa phân loại",
        province: input.province || "Bình Dương",
        district: input.district || "Chưa rõ KCN",
        total_reviews: 0,
        overall_rating: 5.0,
        avg_salary_score: input.score_salary,
        avg_culture_score: input.score_culture,
        avg_wlb_score: input.score_wlb,
        avg_management_score: input.score_management,
        recommend_rate: input.recommend_to_friend ? 100 : 0,
      };
      data.companies.unshift(targetCompany);
    }
  }

  if (!targetCompany) {
    throw new Error("Không xác định được công ty");
  }

  const reviewId = "rev-" + Date.now();
  const averageScore = Number(
    (
      (input.score_salary +
        input.score_culture +
        input.score_wlb +
        input.score_management) /
      4.0
    ).toFixed(1)
  );

  const newReview: CompanyReview = {
    id: reviewId,
    company_id: targetCompany.company_id,
    job_title: input.job_title,
    employment_status: input.employment_status,
    working_period: input.working_period || "Gần đây",
    score_salary: input.score_salary,
    score_culture: input.score_culture,
    score_wlb: input.score_wlb,
    score_management: input.score_management,
    average_score: averageScore,
    pros: input.pros || "Không có",
    cons: input.cons || "Không có",
    advice_to_management: input.advice_to_management,
    recommend_to_friend: input.recommend_to_friend,
    verification_level: 1,
    helpful_count: 0,
    status: "published",
    created_at: new Date().toISOString(),
  };

  // Thêm review vào danh sách
  if (!data.reviews[targetCompany.company_id]) {
    data.reviews[targetCompany.company_id] = [];
  }
  data.reviews[targetCompany.company_id].unshift(newReview);

  // Tính toán lại metrics công ty (chỉ tính review published)
  recalculateCompanyMetrics(data, targetCompany.company_id);

  // Ghi xuống file
  saveData(data);

  return { company: targetCompany, review: newReview };
}

/**
 * Tính toán lại toàn bộ metrics cho công ty, chỉ tính các review 'published' (bỏ qua 'hidden' hoặc 'removed')
 */
function recalculateCompanyMetrics(data: DatabaseState, companyId: string): void {
  const targetCompany = data.companies.find((c) => c.company_id === companyId);
  if (!targetCompany) return;

  const allReviews = (data.reviews[companyId] || []).filter(
    (r) => !r.status || r.status === "published"
  );
  const total = allReviews.length;

  if (total === 0) {
    targetCompany.total_reviews = 0;
    return;
  }

  const sumSalary = allReviews.reduce((acc, r) => acc + r.score_salary, 0);
  const sumCulture = allReviews.reduce((acc, r) => acc + r.score_culture, 0);
  const sumWlb = allReviews.reduce((acc, r) => acc + r.score_wlb, 0);
  const sumManagement = allReviews.reduce((acc, r) => acc + r.score_management, 0);
  const sumRecommended = allReviews.filter((r) => r.recommend_to_friend).length;

  targetCompany.total_reviews = total;
  targetCompany.avg_salary_score = Number((sumSalary / total).toFixed(1));
  targetCompany.avg_culture_score = Number((sumCulture / total).toFixed(1));
  targetCompany.avg_wlb_score = Number((sumWlb / total).toFixed(1));
  targetCompany.avg_management_score = Number((sumManagement / total).toFixed(1));
  targetCompany.overall_rating = Number(
    (
      (targetCompany.avg_salary_score +
        targetCompany.avg_culture_score +
        targetCompany.avg_wlb_score +
        targetCompany.avg_management_score) /
      4.0
    ).toFixed(1)
  );
  targetCompany.recommend_rate = Math.round((sumRecommended / total) * 100);
}

/**
 * Cập nhật trạng thái bài review (ví dụ chuyển thành 'hidden' để ẩn khỏi trang web)
 */
export function updateReviewStatus(reviewId: string, newStatus: ReviewStatus): boolean {
  const data = loadData();
  for (const companyId of Object.keys(data.reviews)) {
    const review = data.reviews[companyId].find((r) => r.id === reviewId);
    if (review) {
      review.status = newStatus;
      recalculateCompanyMetrics(data, companyId);
      saveData(data);
      return true;
    }
  }
  return false;
}

export interface CreateReportInput {
  review_id: string;
  company_id?: string;
  reason: ReportReason;
  details?: string;
  reporter_hash?: string;
}

export function saveReport(input: CreateReportInput): ReviewReport {
  const data = loadData();
  if (!data.reports) {
    data.reports = [];
  }

  const newReport: ReviewReport = {
    id: crypto.randomUUID(),
    review_id: input.review_id,
    company_id: input.company_id,
    reason: input.reason,
    details: input.details?.trim() || undefined,
    status: "pending",
    reporter_hash: input.reporter_hash,
    created_at: new Date().toISOString(),
  };

  data.reports.unshift(newReport);
  saveData(data);
  return newReport;
}

export function getAllReports(): ReviewReport[] {
  const data = loadData();
  return data.reports || [];
}
