import { getAllCompanies } from "@/lib/store";
import HomePageClient from "./HomePageClient";

// Trang chủ luôn cần dữ liệu mới nhất từ Supabase tại thời điểm request,
// không prerender tĩnh (tránh lỗi "uncached or runtime data during prerendering").
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const initialCompanies = await getAllCompanies();
  return <HomePageClient initialCompanies={initialCompanies} />;
}
