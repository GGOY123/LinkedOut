import { NextRequest, NextResponse } from "next/server";
import { getAllCompanies } from "@/lib/store";

export async function GET(req: NextRequest) {
  // Đọc query param để bảo đảm dynamic request trong Next.js 16
  void req.nextUrl.searchParams.get("_t");
  const companies = await getAllCompanies();
  return NextResponse.json(
    { companies },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
