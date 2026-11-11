import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveReview } from "@/lib/store";
import { generateAuthorHash } from "@/lib/anonymity";

const companyReviewSchema = z.object({
  company_id: z.string().optional(),
  company_name: z.string().min(2, "Vui lòng nhập tên công ty").max(200).optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  industry: z.string().optional(),

  job_title: z.string().min(1, "Vui lòng nhập vị trí công việc").max(150),
  employment_status: z.enum(["current", "former"]),
  working_period: z.string().max(100).optional(),

  score_salary: z.number().int().min(1).max(5),
  score_culture: z.number().int().min(1).max(5),
  score_wlb: z.number().int().min(1).max(5),
  score_management: z.number().int().min(1).max(5),

  pros: z.string().optional().default(""),
  cons: z.string().optional().default(""),
  advice_to_management: z.string().optional(),
  recommend_to_friend: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = companyReviewSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: validated.error.format() },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Sinh author_hash ẩn danh từ client IP
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const authorHash = generateAuthorHash(clientIp);

    // Lưu vào Supabase qua store
    const result = await saveReview({
      company_id: data.company_id,
      company_name: data.company_name,
      province: data.province,
      district: data.district,
      industry: data.industry,
      job_title: data.job_title,
      employment_status: data.employment_status,
      working_period: data.working_period,
      score_salary: data.score_salary,
      score_culture: data.score_culture,
      score_wlb: data.score_wlb,
      score_management: data.score_management,
      pros: data.pros,
      cons: data.cons,
      advice_to_management: data.advice_to_management,
      recommend_to_friend: data.recommend_to_friend,
      author_hash: authorHash,
    });

    return NextResponse.json({
      success: true,
      message: "Review đã được ghi nhận thành công và ẩn danh hoàn toàn.",
      company_id: result.company.company_id,
      review_id: result.review.id,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Đã có lỗi xảy ra";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
