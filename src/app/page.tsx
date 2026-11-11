import { getAllCompanies } from "@/lib/store";
import HomePageClient from "./HomePageClient";

export default async function HomePage() {
  const initialCompanies = await getAllCompanies();
  return <HomePageClient initialCompanies={initialCompanies} />;
}
