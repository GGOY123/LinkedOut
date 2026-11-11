# LinkedOut — Nền tảng Review Môi trường & Văn hóa Doanh nghiệp Ẩn danh

**LinkedOut** là nền tảng cho phép người lao động, nhân viên và cựu nhân viên tại Việt Nam chia sẻ đánh giá chân thực, khách quan về môi trường làm việc, chế độ đãi ngộ, văn hóa công ty, cũng như điểm tốt và điểm xấu của các doanh nghiệp trước khi ứng tuyển.

---

## 🎯 Điểm nổi bật về Kiến trúc & Bảo mật

1. **Bảo vệ Danh tính Tuyệt đối (Zero-Knowledge Anonymity):**
   * Review không lưu `user_id` hay bất kỳ thông tin cá nhân nào (PII).
   * Sử dụng cơ chế mã hóa một chiều: `author_hash = HMAC_SHA256(user_id, SERVER_SALT)`.
   * Kể cả khi Database bị rò rỉ hay bị trát đòi pháp lý, hệ thống không thể truy vết ngược danh tính người viết review.
2. **Chống Spam & Tấn công Sybil:**
   * Unique constraint bảo vệ: 1 người (thông qua `author_hash`) chỉ được viết 1 review cho 1 công ty trong 1 khoảng thời gian.
3. **Phân tách Điểm tốt (Pros) & Điểm xấu (Cons):**
   * Đánh giá đa chiều 4 tiêu chí cốt lõi: *Lương & Đãi ngộ*, *Môi trường & Văn hóa*, *Cân bằng cuộc sống (WLB)*, *Ban lãnh đạo*.
   * Chỉ số đo lường mức độ hài lòng: `% Khuyên bạn bè nên vào làm`.
4. **Nhập công ty tự do (On-the-fly Company Registration):**
   * Hỗ trợ tìm kiếm thông minh từ dữ liệu có sẵn hoặc cho phép người dùng đăng ký bất kỳ công ty mới nào trên cả nước.

---

## 🛠 Tech Stack

* **Frontend:** Next.js 16 (App Router, Turbopack, React 19)
* **Styling:** Tailwind CSS v4, Lucide Icons
* **Type Safety & Validation:** TypeScript 5, Zod
* **Database & Auth:** PostgreSQL (Supabase) + Materialized Views
* **Storage Môi trường Dev:** Local File-backed Persistent Store (`src/data/db.json` - đã đưa vào `.gitignore`)

---

## 🚀 Hướng dẫn Cài đặt & Chạy Local

### 1. Cài đặt Dependencies
```bash
npm install
```

### 2. Cấu hình biến môi trường
Sao chép file `.env.example` thành `.env.local`:
```bash
cp .env.example .env.local
```

Nội dung `.env.local`:
```env
# Supabase (Tùy chọn khi kết nối database cloud)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server Secret Salt để tạo HMAC author_hash (Bắt buộc bảo mật)
ANONYMOUS_SALT_SECRET=your_super_secret_salt_key_change_me
```

> **Lưu ý:** Nếu chưa có Supabase, ứng dụng sẽ tự động chạy chế độ lưu trữ cục bộ (Local Store) tại `src/data/db.json`, đầy đủ tính năng tạo công ty và lưu review.

### 3. Khởi chạy Development Server
```bash
npm run dev
```
Truy cập: [http://localhost:3000](http://localhost:3000)

### 4. Kiểm tra Build Production
```bash
npm run build
```

---

## 🗄 Cấu trúc Database (Supabase / PostgreSQL)

Khi kết nối với Supabase, chạy script migration tại:
* [supabase/migrations/00001_initial_schema.sql](supabase/migrations/00001_initial_schema.sql)
* [supabase/seed.sql](supabase/seed.sql) (Dữ liệu mẫu ban đầu)

---

## 📁 Cấu trúc Thư mục

```
LinkedOut/
├── src/
│   ├── app/
│   │   ├── api/             # Backend API Routes (/api/reviews, /api/companies)
│   │   ├── company/[id]/    # Trang chi tiết công ty & tổng hợp review
│   │   ├── review/new/      # Form viết review công ty ẩn danh
│   │   ├── layout.tsx       # Root layout & Metadata
│   │   └── page.tsx         # Trang chủ tìm kiếm & danh sách công ty
│   ├── components/          # Reusable UI components (Navbar, Cards, Stars...)
│   ├── data/                # Mock data & Seed constants
│   ├── lib/                 # Utility functions, Supabase clients & Local Store
│   └── types/               # TypeScript interfaces & Database models
├── supabase/
│   ├── migrations/          # PostgreSQL DDL migrations
│   └── seed.sql             # SQL seed ban đầu
└── .gitignore               # Loại bỏ node_modules, .env, db.json
```

---

## ⚖️ Quy tắc Nội dung & Pháp lý

* Không chấp nhận các nội dung chứa thông tin định danh cá nhân (họ tên, số điện thoại, tài khoản cá nhân của lãnh đạo hoặc đồng nghiệp).
* Người dùng tự chịu trách nhiệm về tính trung thực của nội dung đăng tải.
