import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveReport } from "@/lib/store";
import { generateAuthorHash } from "@/lib/anonymity";
import { ReportReason } from "@/types/database";

const reportSchema = z.object({
  review_id: z.string().min(1, "Thiếu review_id"),
  company_id: z.string().optional(),
  reason: z.enum([
    "defamation",
    "confidential_leak",
    "fake_news",
    "spam",
    "harassment",
    "other",
  ] as [ReportReason, ...ReportReason[]]),
  details: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = reportSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu báo cáo không hợp lệ", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { review_id, company_id, reason, details } = validated.data;

    // Sinh hash ẩn danh của người báo cáo (dùng IP client) để chống spam
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const reporterHash = generateAuthorHash(clientIp);

    // Lưu vào store cục bộ
    const report = saveReport({
      review_id,
      company_id,
      reason,
      details,
      reporter_hash: reporterHash,
    });

    // Nếu cấu hình Supabase thì gửi thêm vào bảng review_reports
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from("review_reports").insert({
          id: report.id,
          review_id: report.review_id,
          company_id: report.company_id,
          reason: report.reason,
          details: report.details,
          status: "pending",
          reporter_hash: report.reporter_hash,
          created_at: report.created_at,
        });
      } catch (err) {
        console.warn("Không thể đồng bộ report lên Supabase:", err);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Báo cáo của bạn đã được tiếp nhận và lưu vào hệ thống kiểm duyệt.",
        report_id: report.id,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi xử lý báo cáo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
