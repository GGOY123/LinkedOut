-- Bảng lưu trữ báo cáo vi phạm bài review
CREATE TABLE IF NOT EXISTS public.review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id TEXT NOT NULL,
    company_id TEXT,
    reason TEXT NOT NULL CHECK (reason IN ('defamation', 'confidential_leak', 'fake_news', 'spam', 'harassment', 'other')),
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    reporter_hash TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- Index để truy vấn nhanh báo cáo đang chờ xử lý (pending)
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.review_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_review_id ON public.review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.review_reports(created_at DESC);

-- Bật Row Level Security (RLS)
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

-- Cho phép người dùng ẩn danh gửi báo cáo (Insert-only)
CREATE POLICY "Cho phép gửi báo cáo ẩn danh"
    ON public.review_reports
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Chỉ quản trị viên (hoặc service_role) mới có quyền đọc và cập nhật trạng thái báo cáo
CREATE POLICY "Chỉ admin được xem báo cáo"
    ON public.review_reports
    FOR SELECT
    TO service_role
    USING (true);

CREATE POLICY "Chỉ admin được cập nhật báo cáo"
    ON public.review_reports
    FOR UPDATE
    TO service_role
    USING (true);
