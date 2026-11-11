import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseClient } from "@/lib/supabase";

// Bucket riêng tư trên Supabase Storage: chỉ server (service_role) mới truy cập được.
const BUCKET = "verification-proofs";
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["application/pdf", "pdf"],
]);

/**
 * Tiếp nhận bằng chứng xác minh (ảnh chụp Quyết định thôi việc / Thư mời nhận việc)
 * cho một review đã được tạo. File được lưu vào bucket riêng tư và ghi một bản ghi
 * verification_proofs ở trạng thái 'pending' để admin duyệt sau.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const reviewId = form.get("review_id");
    const file = form.get("file");

    if (typeof reviewId !== "string" || !reviewId) {
      return NextResponse.json(
        { error: "Thiếu mã review để gắn bằng chứng." },
        { status: 400 }
      );
    }
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Chưa chọn file bằng chứng." },
        { status: 400 }
      );
    }
    const ext = ALLOWED_TYPES.get(file.type);
    if (!ext) {
      return NextResponse.json(
        { error: "Chỉ chấp nhận ảnh (JPG, PNG, WebP, GIF) hoặc PDF." },
        { status: 400 }
      );
    }
    if (file.size === 0 || file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File bằng chứng phải nhỏ hơn 5 MB." },
        { status: 400 }
      );
    }

    // Review phải tồn tại thật trên hệ thống (đọc bằng khóa công khai là đủ).
    const pub = getSupabaseClient();
    if (!pub) {
      return NextResponse.json(
        { error: "Hệ thống chưa sẵn sàng để tiếp nhận bằng chứng." },
        { status: 503 }
      );
    }
    const { data: reviewRow, error: reviewErr } = await pub
      .from("company_reviews")
      .select("id")
      .eq("id", reviewId)
      .maybeSingle();
    if (reviewErr || !reviewRow) {
      return NextResponse.json(
        { error: "Review không tồn tại trên hệ thống." },
        { status: 400 }
      );
    }

    // Tải file và ghi bản ghi duyệt: bắt buộc dùng client quản trị (service_role).
    // Tuyệt đối không fallback về khóa công khai cho thao tác này.
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Hệ thống xác minh chưa được cấu hình phía máy chủ." },
        { status: 503 }
      );
    }
    const admin = getSupabaseAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Hệ thống xác minh chưa sẵn sàng." },
        { status: 503 }
      );
    }

    const filePath = `${reviewId}/${crypto.randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadErr } = await admin.storage
      .from(BUCKET)
      .upload(filePath, bytes, { contentType: file.type, upsert: false });
    if (uploadErr) {
      return NextResponse.json(
        { error: "Không tải được file bằng chứng lên hệ thống." },
        { status: 500 }
      );
    }

    const { error: insertErr } = await admin
      .from("verification_proofs")
      .insert({ review_id: reviewId, file_path: filePath, status: "pending" });
    if (insertErr) {
      // Dọn file vừa tải để tránh file rác không có bản ghi quản lý.
      await admin.storage.from(BUCKET).remove([filePath]);
      return NextResponse.json(
        { error: "Không ghi nhận được bằng chứng xác minh." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Đã nhận bằng chứng xác minh. Admin sẽ xem xét và gắn huy hiệu nếu hợp lệ.",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Đã có lỗi xảy ra";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
