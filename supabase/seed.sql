-- ==============================================================================
-- LINKEDOUT SEED DATA (Mẫu dữ liệu thực tế khu công nghiệp & nhà máy phía Nam)
-- Khu vực: TP.HCM, Bình Dương (VSIP 1, VSIP 2), Đồng Nai (KCN Amata, Biên Hòa)
-- ==============================================================================

-- 1. TẠO CÔNG TY MẪU
INSERT INTO public.companies (id, name, normalized_name, tax_code, industry, province, district, website, status)
VALUES 
    (
        '11111111-1111-1111-1111-111111111111',
        'Công ty TNHH Foster Electric Việt Nam',
        'cong ty tnhh foster electric viet nam',
        '3700776512',
        'Sản xuất linh kiện điện tử',
        'Bình Dương',
        'KCN VSIP 1, TP. Thuận An',
        'https://www.foster-electric.com',
        'approved'
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'Công ty TNHH Yazaki EDS Việt Nam',
        'cong ty tnhh yazaki eds viet nam',
        '3700244199',
        'Sản xuất phụ tùng ô tô & linh kiện dây dẫn',
        'Bình Dương',
        'TP. Dĩ An',
        'https://www.yazaki-group.com',
        'approved'
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'Công ty TNHH Nestlé Việt Nam (Nhà máy Trị An)',
        'cong ty tnhh nestle viet nam nha may tri an',
        '3600235305',
        'FMCG / Thực phẩm & Đồ uống',
        'Đồng Nai',
        'KCN Amata, TP. Biên Hòa',
        'https://www.nestle.com.vn',
        'approved'
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        'Công ty TNHH Nidec Sankyo Việt Nam',
        'cong ty tnhh nidec sankyo viet nam',
        '0303867621',
        'Cơ khí chính xác & Thiết bị quang học',
        'TP.HCM',
        'Khu Công nghệ cao (SHTP), TP. Thủ Đức',
        'https://www.nidec.com',
        'approved'
    ),
    (
        '55555555-5555-5555-5555-555555555555',
        'Công ty Cổ phần Sữa Việt Nam (Vinamilk - Nhà máy Mega)',
        'cong ty co phan sua viet nam vinamilk nha may mega',
        '0300588562',
        'Chế biến thực phẩm & đồ uống',
        'Bình Dương',
        'KCN Mỹ Phước 2, TX. Bến Cát',
        'https://www.vinamilk.com.vn',
        'approved'
    )
ON CONFLICT (id) DO NOTHING;

-- 2. TẠO REVIEW MÔI TRƯỜNG & VĂN HÓA CÔNG TY (company_reviews)
INSERT INTO public.company_reviews (
    id, company_id, author_hash, job_title, employment_status, working_period,
    score_salary, score_culture, score_wlb, score_management,
    pros, cons, advice_to_management, recommend_to_friend,
    verification_level, status, helpful_count
) VALUES
    (
        'a1111111-aaaa-1111-aaaa-111111111111',
        '11111111-1111-1111-1111-111111111111',
        'hash_sha256_mock_001_foster_qa',
        'Kỹ sư QA/QC',
        'former',
        '2021 - 2024',
        4, 5, 4, 4,
        'Môi trường làm việc chuẩn Nhật Bản, rất kỷ luật và đào tạo bài bản cho người mới. Đồng nghiệp hỗ trợ nhiệt tình, không đấu đá nội bộ. Lương trả đúng hạn, thưởng Tết và đánh giá tăng lương hàng năm minh bạch. Cơm trưa nhà ăn sạch sẽ, xe đưa rước từ TP.HCM chạy đúng giờ.',
        'Quy trình phê duyệt hơi rập khuôn và qua nhiều cấp, khó đề xuất cải tiến mới nhanh chóng. Mùa cao điểm đơn hàng phải OT khá nhiều vào thứ Bảy. Cơ hội thăng tiến lên cấp quản lý người Việt hơi chậm do vị trí chủ chốt vẫn do người Nhật nắm giữ.',
        'Nên tạo điều kiện và tin tưởng hơn vào các kỹ sư trẻ người Việt trong việc quyết định kỹ thuật dây chuyền.',
        true,
        2,
        'published',
        36
    ),
    (
        'a2222222-aaaa-2222-aaaa-222222222222',
        '11111111-1111-1111-1111-111111111111',
        'hash_sha256_mock_002_foster_prod',
        'Kỹ sư Vận hành Sản xuất',
        'current',
        '2024 - Hiện tại',
        3, 4, 3, 4,
        'Chế độ bảo hiểm đầy đủ (có thêm bảo hiểm tai nạn 24/7). Môi trường xưởng máy lạnh mát mẻ, an toàn lao động đặt lên hàng đầu (5S cực kỳ nghiêm ngặt).',
        'Lương khởi điểm cho kỹ sư mới ra trường chỉ ở mức trung bình so với mặt bằng chung các KCN lân cận. Áp lực sản lượng vào những đợt audit của khách hàng lớn là rất căng thẳng.',
        'Cần xem xét tăng phụ cấp ca kíp và tiền ăn tăng ca cho anh em kỹ thuật.',
        true,
        1,
        'published',
        19
    ),
    (
        'a3333333-aaaa-3333-aaaa-333333333333',
        '33333333-3333-3333-3333-333333333333',
        'hash_sha256_mock_003_nestle_maint',
        'Kỹ sư Bảo trì & Tự động hóa',
        'current',
        '2022 - Hiện tại',
        5, 5, 4, 5,
        'Chế độ đãi ngộ hàng đầu trong ngành FMCG. Thưởng KPI hàng năm từ 2-4 tháng lương. Trang thiết bị và dây chuyền tự động hóa đạt chuẩn Thụy Sĩ. Văn hóa an toàn và tôn trọng nhân viên rất cao.',
        'Yêu cầu khắt khe về vệ sinh an toàn thực phẩm, vi phạm nhỏ cũng có thể bị kỷ luật nặng. Lịch trực bảo trì máy đôi khi phải làm ca đêm.',
        'Tiếp tục duy trì môi trường làm việc cởi mở và phúc lợi tốt cho anh em kỹ thuật.',
        true,
        2,
        'published',
        42
    ),
    (
        'a4444444-aaaa-4444-aaaa-444444444444',
        '22222222-2222-2222-2222-222222222222',
        'hash_sha256_mock_004_yazaki_tech',
        'Kỹ thuật viên Dây chuyền',
        'former',
        '2023 - 2024',
        3, 3, 2, 3,
        'Lương và phụ cấp chi trả đúng ngày. Có xe đưa rước và nhà ăn tương đối sạch.',
        'Áp lực công việc cao, OT thường xuyên cuối tuần. Quản lý phân xưởng khá gắt gao, ít lắng nghe phản ánh từ công nhân.',
        'Cần cải thiện việc cân bằng thời gian làm việc và đời sống cho công nhân.',
        false,
        1,
        'published',
        25
    )
ON CONFLICT (id) DO NOTHING;

-- Làm mới Materialized View sau khi seed
REFRESH MATERIALIZED VIEW public.company_metrics;
