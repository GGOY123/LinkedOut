import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseClient } from "@/lib/supabase";

// File bằng chứng được trình duyệt tải thẳng lên bucket riêng tư
// "verification-proofs" (chính sách Storage chỉ cho phép thêm mới, không cho
// đọc/sửa/xóa bằng khóa công khai). Route này chỉ làm nhiệm vụ ghi nhận
// bản ghi duyệt tương ứng sau khi file đã lên thành công.
const VerifySchema = z.object({
  review_id: z.string().uuid("Mã review không hợp lệ"),
  file_path: z.string().min(1).max(300),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = VerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu bằng chứng không hợp lệ." },
        { status: 400 }
      );
    }
    const { review_id, file_path } = parsed.data;

    // Đường dẫn file phải nằm trong thư mục mang mã của chính review đó.
    if (!file_path.startsWith(`${review_id}/`)) {
      return NextResponse.json(
        { error: "Đường dẫn bằng chứng không khớp với review." },
        { status: 400 }
      );
    }

    // Review phải tồn tại thật trên hệ thống.
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
      .eq("id", review_id)
      .maybeSingle();
    if (reviewErr || !reviewRow) {
      return NextResponse.json(
        { error: "Review không tồn tại trên hệ thống." },
        { status: 400 }
      );
    }

    // Ghi bản ghi duyệt qua PostgREST trực tiếp với header apikey chứa khóa
    // bí mật mới (sb_secret_). Bảng verification_proofs không mở quyền ghi
    // cho khóa công khai; khóa bí mật được gateway chấp nhận qua apikey mà
    // không cần Authorization (khóa này không phải JWT).
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json(
        { error: "Hệ thống xác minh chưa được cấu hình phía máy chủ." },
        { status: 503 }
      );
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/verification_proofs`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ review_id, file_path, status: "pending" }),
    });
    if (!insertRes.ok) {
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
