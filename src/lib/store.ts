import crypto from "crypto";
import { getSupabaseClient, getSupabaseAdminClient } from "@/lib/supabase";
import { 
  CompanyMetrics, 
  CompanyReview, 
  ReviewReport, 
  ReportReason, 
  ReviewStatus 
} from "@/types/database";
import { normalizeVietnamese } from "@/lib/utils";
import { generateAuthorHash } from "@/lib/anonymity";

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
  author_hash?: string;
}

export interface CreateReportInput {
  review_id: string;
  company_id?: string;
  reason: ReportReason;
  details?: string;
  reporter_hash?: string;
}

interface RawReviewRow {
  id: string;
  company_id: string;
  job_title: string;
  employment_status: "current" | "former";
  working_period?: string | null;
  score_salary: number;
  score_culture: number;
  score_wlb: number;
  score_management: number;
  pros?: string | null;
  cons?: string | null;
  advice_to_management?: string | null;
  recommend_to_friend?: boolean | null;
  verification_level?: number | null;
  helpful_count?: number | null;
  status?: string | null;
  created_at: string;
}

interface RawCompanyWithReviews {
  id: string;
  name: string;
  normalized_name: string;
  industry: string;
  province: string;
  district: string;
  status: string;
  company_reviews?: Array<{
    id: string;
    score_salary: number;
    score_culture: number;
    score_wlb: number;
    score_management: number;
    recommend_to_friend: boolean;
    status: string;
  }>;
}

function calculateCompanyMetrics(c: RawCompanyWithReviews): CompanyMetrics {
  const publishedReviews = (c.company_reviews || []).filter(
    (r) => !r.status || r.status === "published"
  );
  const total = publishedReviews.length;

  if (total === 0) {
    return {
      company_id: c.id,
      company_name: c.name,
      normalized_name: c.normalized_name,
      industry: c.industry,
      province: c.province,
      district: c.district,
      total_reviews: 0,
      overall_rating: 0,
      avg_salary_score: 0,
      avg_culture_score: 0,
      avg_wlb_score: 0,
      avg_management_score: 0,
      recommend_rate: 0,
    };
  }

  const sumSalary = publishedReviews.reduce((acc, r) => acc + (r.score_salary || 0), 0);
  const sumCulture = publishedReviews.reduce((acc, r) => acc + (r.score_culture || 0), 0);
  const sumWlb = publishedReviews.reduce((acc, r) => acc + (r.score_wlb || 0), 0);
  const sumManagement = publishedReviews.reduce((acc, r) => acc + (r.score_management || 0), 0);
  const sumRecommended = publishedReviews.filter((r) => r.recommend_to_friend).length;

  const avgSalary = Number((sumSalary / total).toFixed(1));
  const avgCulture = Number((sumCulture / total).toFixed(1));
  const avgWlb = Number((sumWlb / total).toFixed(1));
  const avgManagement = Number((sumManagement / total).toFixed(1));
  const overall = Number(((avgSalary + avgCulture + avgWlb + avgManagement) / 4.0).toFixed(1));
  const recommendRate = Math.round((sumRecommended / total) * 100);

  return {
    company_id: c.id,
    company_name: c.name,
    normalized_name: c.normalized_name,
    industry: c.industry,
    province: c.province,
    district: c.district,
    total_reviews: total,
    overall_rating: overall,
    avg_salary_score: avgSalary,
    avg_culture_score: avgCulture,
    avg_wlb_score: avgWlb,
    avg_management_score: avgManagement,
    recommend_rate: recommendRate,
  };
}

function mapReviewRow(r: RawReviewRow): CompanyReview {
  const salary = r.score_salary || 0;
  const culture = r.score_culture || 0;
  const wlb = r.score_wlb || 0;
  const management = r.score_management || 0;
  const average = Number(((salary + culture + wlb + management) / 4.0).toFixed(1));

  return {
    id: r.id,
    company_id: r.company_id,
    job_title: r.job_title,
    employment_status: r.employment_status,
    working_period: r.working_period || "Gần đây",
    score_salary: salary,
    score_culture: culture,
    score_wlb: wlb,
    score_management: management,
    average_score: average,
    pros: r.pros || "Không có",
    cons: r.cons || "Không có",
    advice_to_management: r.advice_to_management || undefined,
    recommend_to_friend: Boolean(r.recommend_to_friend),
    verification_level: r.verification_level === 2 ? 2 : 1,
    helpful_count: r.helpful_count || 0,
    status: (r.status as ReviewStatus) || "published",
    created_at: r.created_at,
  };
}

/**
 * Lấy tất cả công ty từ Supabase (bảng companies join company_reviews)
 * Trả về mảng rỗng nếu chưa có dữ liệu hoặc chưa kết nối DB.
 */
export async function getAllCompanies(): Promise<CompanyMetrics[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn("[LinkedOut Store] Supabase chưa được cấu hình. Trả về danh sách rỗng.");
    return [];
  }

  // 1. Thử lấy từ materialized view company_metrics nếu có sẵn
  const { data: viewData, error: viewError } = await supabase
    .from("company_metrics")
    .select("*");

  if (!viewError && viewData && viewData.length > 0) {
    return viewData.map((row) => ({
      company_id: row.company_id,
      company_name: row.company_name,
      normalized_name: row.normalized_name,
      industry: row.industry,
      province: row.province,
      district: row.district,
      total_reviews: Number(row.total_reviews) || 0,
      overall_rating: Number(row.overall_rating) || 0,
      avg_salary_score: Number(row.avg_salary_score) || 0,
      avg_culture_score: Number(row.avg_culture_score) || 0,
      avg_wlb_score: Number(row.avg_wlb_score) || 0,
      avg_management_score: Number(row.avg_management_score) || 0,
      recommend_rate: Number(row.recommend_rate) || 0,
    }));
  }

  // 2. Fallback trực tiếp vào bảng companies + company_reviews (thời gian thực, không phụ thuộc refresh view)
  const { data: companies, error: compError } = await supabase
    .from("companies")
    .select(`
      id,
      name,
      normalized_name,
      industry,
      province,
      district,
      status,
      company_reviews (
        id,
        score_salary,
        score_culture,
        score_wlb,
        score_management,
        recommend_to_friend,
        status
      )
    `)
    .eq("status", "approved");

  if (compError) {
    console.error("[LinkedOut Store] Lỗi truy vấn companies từ Supabase:", compError.message);
    return [];
  }

  if (!companies || companies.length === 0) {
    return [];
  }

  return (companies as RawCompanyWithReviews[]).map(calculateCompanyMetrics);
}

/**
 * Lấy thông tin chi tiết một công ty theo ID (hoặc slug normalized_name) từ Supabase
 */
export async function getCompanyById(companyId: string): Promise<CompanyMetrics | null> {
  const supabase = getSupabaseClient();
  if (!supabase || !companyId) {
    return null;
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId);

  // 1. Thử tìm trong view company_metrics nếu có
  let viewQuery = supabase.from("company_metrics").select("*");
  if (isUuid) {
    viewQuery = viewQuery.eq("company_id", companyId);
  } else {
    viewQuery = viewQuery.eq("normalized_name", companyId);
  }
  const { data: viewData, error: viewErr } = await viewQuery.maybeSingle();
  if (!viewErr && viewData) {
    return {
      company_id: viewData.company_id,
      company_name: viewData.company_name,
      normalized_name: viewData.normalized_name,
      industry: viewData.industry,
      province: viewData.province,
      district: viewData.district,
      total_reviews: Number(viewData.total_reviews) || 0,
      overall_rating: Number(viewData.overall_rating) || 0,
      avg_salary_score: Number(viewData.avg_salary_score) || 0,
      avg_culture_score: Number(viewData.avg_culture_score) || 0,
      avg_wlb_score: Number(viewData.avg_wlb_score) || 0,
      avg_management_score: Number(viewData.avg_management_score) || 0,
      recommend_rate: Number(viewData.recommend_rate) || 0,
    };
  }

  // 2. Fallback trực tiếp vào bảng companies join company_reviews
  let tableQuery = supabase
    .from("companies")
    .select(`
      id,
      name,
      normalized_name,
      industry,
      province,
      district,
      status,
      company_reviews (
        id,
        score_salary,
        score_culture,
        score_wlb,
        score_management,
        recommend_to_friend,
        status
      )
    `);

  if (isUuid) {
    tableQuery = tableQuery.eq("id", companyId);
  } else {
    tableQuery = tableQuery.eq("normalized_name", companyId);
  }

  const { data: c, error } = await tableQuery.maybeSingle();

  if (error || !c) {
    return null;
  }

  return calculateCompanyMetrics(c as RawCompanyWithReviews);
}

/**
 * Lấy danh sách review của một công ty theo ID (hoặc slug) từ Supabase
 */
export async function getReviewsByCompanyId(
  companyId: string,
  includeHidden = false
): Promise<CompanyReview[]> {
  const supabase = getSupabaseClient();
  if (!supabase || !companyId) {
    return [];
  }

  let targetUuid = companyId;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId);

  // Nếu không phải định dạng UUID (ví dụ: slug), tra cứu ID trước
  if (!isUuid) {
    const { data: comp } = await supabase
      .from("companies")
      .select("id")
      .eq("normalized_name", companyId)
      .maybeSingle();

    if (comp?.id) {
      targetUuid = comp.id;
    } else {
      return [];
    }
  }

  let query = supabase
    .from("company_reviews")
    .select("*")
    .eq("company_id", targetUuid)
    .order("created_at", { ascending: false });

  if (!includeHidden) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error("[LinkedOut Store] Lỗi tải reviews:", error?.message);
    return [];
  }

  return (data as RawReviewRow[]).map(mapReviewRow);
}

/**
 * Lưu bài review mới vào Supabase (bảng company_reviews)
 * Tự động tạo công ty mới trong bảng companies nếu chưa tồn tại.
 */
export async function saveReview(
  input: CreateReviewInput
): Promise<{ company: CompanyMetrics; review: CompanyReview }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error(
      "Chưa cấu hình Supabase. Vui lòng thiết lập biến môi trường NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  let targetCompanyId = input.company_id;

  // Nếu người dùng nhập tên công ty mới hoặc chưa có company_id
  if (!targetCompanyId && input.company_name) {
    const norm = normalizeVietnamese(input.company_name);

    // Kiểm tra xem công ty đã có trong DB chưa
    const { data: existingCompany } = await supabase
      .from("companies")
      .select("id")
      .eq("normalized_name", norm)
      .maybeSingle();

    if (existingCompany) {
      targetCompanyId = existingCompany.id;
    } else {
      // Tạo mới công ty
      const { data: newCompany, error: createCompErr } = await supabase
        .from("companies")
        .insert({
          name: input.company_name.trim(),
          normalized_name: norm,
          industry: input.industry?.trim() || "Chưa phân loại",
          province: input.province || "Bình Dương",
          district: input.district?.trim() || "Chưa rõ KCN",
          status: "approved",
        })
        .select()
        .single();

      if (createCompErr) {
        // Xử lý race condition: Có thể công ty vừa được tạo đồng thời bởi request khác
        const { data: retryCompany } = await supabase
          .from("companies")
          .select("id")
          .eq("normalized_name", norm)
          .maybeSingle();

        if (retryCompany) {
          targetCompanyId = retryCompany.id;
        } else {
          throw new Error("Không thể tạo công ty mới trong database: " + createCompErr.message);
        }
      } else if (newCompany) {
        targetCompanyId = newCompany.id;
      }
    }
  }

  if (!targetCompanyId) {
    throw new Error("Không xác định được công ty để lưu đánh giá.");
  }

  // Tạo author_hash ẩn danh
  const authorHash = input.author_hash || generateAuthorHash(crypto.randomUUID());

  // Lưu review vào bảng company_reviews
  const { data: newReviewRow, error: revErr } = await supabase
    .from("company_reviews")
    .insert({
      company_id: targetCompanyId,
      author_hash: authorHash,
      job_title: input.job_title.trim(),
      employment_status: input.employment_status,
      working_period: input.working_period?.trim() || "Gần đây",
      score_salary: input.score_salary,
      score_culture: input.score_culture,
      score_wlb: input.score_wlb,
      score_management: input.score_management,
      pros: input.pros?.trim() || "Không có",
      cons: input.cons?.trim() || "Không có",
      advice_to_management: input.advice_to_management?.trim() || null,
      recommend_to_friend: input.recommend_to_friend,
      verification_level: 1,
      helpful_count: 0,
      status: "published",
    })
    .select()
    .single();

  if (revErr || !newReviewRow) {
    throw new Error("Không thể ghi nhận đánh giá vào Supabase: " + (revErr?.message || ""));
  }

  // Lấy lại chỉ số công ty đã được cập nhật
  const updatedCompany = await getCompanyById(targetCompanyId);
  if (!updatedCompany) {
    throw new Error("Ghi review thành công nhưng không thể đọc lại thông tin công ty.");
  }

  return {
    company: updatedCompany,
    review: mapReviewRow(newReviewRow as RawReviewRow),
  };
}

/**
 * Cập nhật trạng thái review (ví dụ: 'hidden' để ẩn review vi phạm)
 */
export async function updateReviewStatus(
  reviewId: string,
  newStatus: ReviewStatus
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("company_reviews")
    .update({ status: newStatus })
    .eq("id", reviewId);

  if (error) {
    console.error("[LinkedOut Store] Lỗi cập nhật trạng thái review:", error.message);
    return false;
  }
  return true;
}

/**
 * Lưu báo cáo vi phạm vào bảng review_reports
 */
export async function saveReport(input: CreateReportInput): Promise<ReviewReport> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Chưa cấu hình Supabase để tiếp nhận báo cáo vi phạm.");
  }

  const { data, error } = await supabase
    .from("review_reports")
    .insert({
      review_id: input.review_id,
      company_id: input.company_id || null,
      reason: input.reason,
      details: input.details?.trim() || null,
      reporter_hash: input.reporter_hash || null,
      status: "pending",
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error("Không thể lưu báo cáo vi phạm vào Supabase: " + (error?.message || ""));
  }

  return data as ReviewReport;
}

/**
 * Lấy danh sách báo cáo vi phạm từ bảng review_reports
 */
export async function getAllReports(): Promise<ReviewReport[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("review_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[LinkedOut Store] Lỗi lấy danh sách báo cáo:", error?.message);
    return [];
  }

  return data as ReviewReport[];
}
