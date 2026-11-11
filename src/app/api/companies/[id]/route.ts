import { NextRequest, NextResponse } from "next/server";
import { getCompanyById, getReviewsByCompanyId } from "@/lib/store";


interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id || "");
  const company = await getCompanyById(decodedId);

  if (!company) {
    return NextResponse.json({ error: "Không tìm thấy công ty" }, { status: 404 });
  }

  const reviews = await getReviewsByCompanyId(decodedId);

  return NextResponse.json({
    company,
    reviews,
  });
}
