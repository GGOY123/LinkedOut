import { Suspense } from "react";
import { getAllCompanies } from "@/lib/store";
import HomePageClient from "./HomePageClient";

// Trang chủ lấy dữ liệu runtime từ Supabase: phần fetch phải nằm trong <Suspense>
// để tương thích cacheComponents của Next 16 (không dùng route segment config
// "dynamic" vì bị cấm khi bật cacheComponents, và fetch ngoài Suspense sẽ lỗi
// "uncached or runtime data during prerendering" lúc build).
async function HomePageData() {
  const initialCompanies = await getAllCompanies();
  return <HomePageClient initialCompanies={initialCompanies} />;
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageData />
    </Suspense>
  );
}
