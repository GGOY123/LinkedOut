export type CompanyStatus = 'pending' | 'approved' | 'hidden';
export type EmploymentStatus = 'current' | 'former';
export type ReviewStatus = 'published' | 'hidden' | 'removed';

export interface Company {
  id: string;
  name: string;
  normalized_name: string;
  tax_code?: string | null;
  industry: string;
  province: string;
  district: string;
  website?: string | null;
  logo_url?: string | null;
  status: CompanyStatus;
  created_at: string;
  updated_at: string;
}

export interface CompanyMetrics {
  company_id: string;
  company_name: string;
  normalized_name: string;
  industry: string;
  province: string;
  district: string;
  total_reviews: number;
  overall_rating: number; // Điểm trung bình 1 - 5 sao
  avg_salary_score: number; // Lương thưởng & Đãi ngộ
  avg_culture_score: number; // Môi trường & Văn hóa
  avg_wlb_score: number; // Cân bằng cuộc sống (Work-Life Balance)
  avg_management_score: number; // Lãnh đạo & Quản lý
  recommend_rate: number; // Tỉ lệ % khuyên bạn bè vào làm
}

export interface CompanyReview {
  id: string;
  company_id: string;
  job_title: string;
  employment_status: EmploymentStatus; // Đang làm việc hoặc Đã nghỉ việc
  working_period?: string; // Ví dụ: 2022 - 2024
  
  // Đánh giá đa chiều 1 - 5 sao
  score_salary: number;
  score_culture: number;
  score_wlb: number;
  score_management: number;
  average_score: number;

  // Cốt lõi: Điểm tốt & Điểm xấu
  pros: string; // Ưu điểm (Điểm tốt)
  cons: string; // Nhược điểm (Điểm xấu)
  advice_to_management?: string; // Lời khuyên cho ban lãnh đạo

  recommend_to_friend: boolean; // Có khuyên bạn bè vào làm không
  verification_level: 1 | 2; // 1 = Member, 2 = Đã xác minh thư mời / quyết định thôi việc
  helpful_count: number;
  status?: ReviewStatus; // 'published' | 'hidden' | 'removed'
  created_at: string;
}

export type ReportReason =
  | 'defamation' // Bôi nhọ, xúc phạm cá nhân
  | 'confidential_leak' // Tiết lộ bí mật kinh doanh/lộ dữ liệu nội bộ
  | 'fake_news' // Thông tin bịa đặt, sai sự thật
  | 'spam' // Quảng cáo, spam
  | 'harassment' // Ngôn từ thù hận, quấy rối
  | 'other'; // Khác

export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';

export interface ReviewReport {
  id: string;
  review_id: string;
  company_id?: string;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  reporter_hash?: string;
  admin_notes?: string;
  created_at: string;
  resolved_at?: string;
}
