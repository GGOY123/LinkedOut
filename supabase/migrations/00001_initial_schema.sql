-- ==============================================================================
-- LINKEDOUT DATABASE SCHEMA (PostgreSQL / Supabase)
-- Core Domain: Nền tảng Review Môi trường, Văn hóa, Điểm tốt & Điểm xấu Công ty
-- Security: Pseudonymous author_hash, Ephemeral verification, Zero PII leaks
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BẢNG PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. BẢNG CÔNG TY (COMPANIES)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    normalized_name VARCHAR(255) NOT NULL,
    tax_code VARCHAR(50),
    industry VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    website VARCHAR(255),
    logo_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'hidden')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_company_identity 
ON public.companies (normalized_name, province, district);

-- 3. BẢNG REVIEWS CÔNG TY (COMPANY REVIEWS)
CREATE TABLE IF NOT EXISTS public.company_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- ẨN DANH: HMAC-SHA256(user_id, salt)
    author_hash VARCHAR(64) NOT NULL,
    
    job_title VARCHAR(150) NOT NULL,
    employment_status VARCHAR(20) NOT NULL CHECK (employment_status IN ('current', 'former')),
    working_period VARCHAR(100),
    
    -- Đánh giá 1 - 5 sao
    score_salary SMALLINT NOT NULL CHECK (score_salary BETWEEN 1 AND 5),
    score_culture SMALLINT NOT NULL CHECK (score_culture BETWEEN 1 AND 5),
    score_wlb SMALLINT NOT NULL CHECK (score_wlb BETWEEN 1 AND 5),
    score_management SMALLINT NOT NULL CHECK (score_management BETWEEN 1 AND 5),
    
    -- CỐT LÕI: ĐIỂM TỐT & ĐIỂM XẤU
    pros TEXT NOT NULL,
    cons TEXT NOT NULL,
    advice_to_management TEXT,
    
    recommend_to_friend BOOLEAN NOT NULL DEFAULT true,
    verification_level SMALLINT NOT NULL DEFAULT 1 CHECK (verification_level IN (1, 2)),
    status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'removed')),
    helpful_count INTEGER NOT NULL DEFAULT 0 CHECK (helpful_count >= 0),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_company_reviews_cid ON public.company_reviews(company_id, status, created_at DESC);

-- 4. BẢNG BẰNG CHỨNG XÁC MINH (EPHEMERAL)
CREATE TABLE IF NOT EXISTS public.verification_proofs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES public.company_reviews(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (timezone('utc'::text, now()) + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. MATERIALIZED VIEW: CHỈ SỐ TỔNG HỢP CÔNG TY
DROP MATERIALIZED VIEW IF EXISTS public.company_metrics;
CREATE MATERIALIZED VIEW public.company_metrics AS
SELECT 
    c.id AS company_id,
    c.name AS company_name,
    c.normalized_name,
    c.industry,
    c.province,
    c.district,
    COUNT(r.id) AS total_reviews,
    ROUND(
        (COALESCE(AVG(r.score_salary), 0) + 
         COALESCE(AVG(r.score_culture), 0) + 
         COALESCE(AVG(r.score_wlb), 0) + 
         COALESCE(AVG(r.score_management), 0)) / 4.0, 1
    ) AS overall_rating,
    ROUND(COALESCE(AVG(r.score_salary), 0), 1) AS avg_salary_score,
    ROUND(COALESCE(AVG(r.score_culture), 0), 1) AS avg_culture_score,
    ROUND(COALESCE(AVG(r.score_wlb), 0), 1) AS avg_wlb_score,
    ROUND(COALESCE(AVG(r.score_management), 0), 1) AS avg_management_score,
    ROUND(
        COUNT(r.id) FILTER (WHERE r.recommend_to_friend = true) * 100.0 / NULLIF(COUNT(r.id), 0), 0
    ) AS recommend_rate
FROM public.companies c
LEFT JOIN public.company_reviews r ON c.id = r.company_id AND r.status = 'published'
WHERE c.status = 'approved'
GROUP BY c.id, c.name, c.normalized_name, c.industry, c.province, c.district;

CREATE UNIQUE INDEX IF NOT EXISTS uq_company_metrics_id ON public.company_metrics (company_id);
