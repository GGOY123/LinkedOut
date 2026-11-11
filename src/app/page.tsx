"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, Building, Award } from "lucide-react";
import { MOCK_COMPANIES } from "@/data/mockData";
import { CompanyCard } from "@/components/CompanyCard";
import { normalizeVietnamese } from "@/lib/utils";
import { CompanyMetrics } from "@/types/database";

export default function HomePage() {
  const [companies, setCompanies] = useState<CompanyMetrics[]>(MOCK_COMPANIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");

  useEffect(() => {
    fetch("/api/companies")
      .then((res) => res.json())
      .then((data) => {
        if (data.companies && data.companies.length > 0) {
          setCompanies(data.companies);
        }
      })
      .catch((err) => console.error("Lỗi tải danh sách công ty:", err));
  }, []);

  const provinces = [
    { id: "all", label: "Tất cả khu vực" },
    { id: "Bình Dương", label: "Bình Dương (VSIP, Mỹ Phước...)" },
    { id: "Đồng Nai", label: "Đồng Nai (Amata, Biên Hòa...)" },
    { id: "TP.HCM", label: "TP.HCM (SHTP, Tân Thuận...)" },
  ];

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      if (selectedProvince !== "all" && company.province !== selectedProvince) {
        return false;
      }

      if (searchQuery.trim() !== "") {
        const queryNorm = normalizeVietnamese(searchQuery);
        const nameNorm = company.normalized_name;
        const industryNorm = normalizeVietnamese(company.industry);
        const districtNorm = normalizeVietnamese(company.district);

        return (
          nameNorm.includes(queryNorm) ||
          industryNorm.includes(queryNorm) ||
          districtNorm.includes(queryNorm)
        );
      }

      return true;
    });
  }, [companies, searchQuery, selectedProvince]);

  return (
    <div className="min-h-screen bg-zinc-50/60 pb-16 dark:bg-zinc-950">
      {/* Hero Section */}
      <section className="border-b border-zinc-200 bg-white py-14 px-4 sm:px-6 lg:px-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
            <Award className="h-3.5 w-3.5" />
            Nền tảng Review Môi trường & Văn hóa Doanh nghiệp
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl dark:text-zinc-100">
            Review công ty <span className="text-red-600">v2.0</span>
          </h1>
          <p className="mt-3 text-sm text-zinc-600 sm:text-base dark:text-zinc-400 max-w-2xl mx-auto">
            Xem đánh giá thực tế về lương thưởng, phúc lợi, môi trường làm việc, phong cách quản lý và văn hóa công ty do chính nhân viên và cựu nhân viên chia sẻ ẩn danh.
          </p>

          {/* Search Bar */}
          <div className="mt-8 mx-auto max-w-2xl">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm công ty theo tên, ngành nghề hoặc KCN (VD: Foster, Nestlé, Vinamilk, Yazaki)..."
                className="w-full rounded-xl border border-zinc-300 bg-white py-3.5 pl-12 pr-4 text-sm text-zinc-900 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {provinces.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProvince(p.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedProvince === p.id
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Companies Grid */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Các công ty được review nhiều nhất ({filteredCompanies.length})
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Tổng hợp điểm tốt, điểm xấu và mức độ hài lòng từ nhân viên
            </p>
          </div>
        </div>

        {filteredCompanies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCompanies.map((company) => (
              <CompanyCard key={company.company_id} company={company} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
            <Building className="mx-auto h-12 w-12 text-zinc-400" />
            <h3 className="mt-3 text-base font-bold text-zinc-800 dark:text-zinc-200">
              Chưa tìm thấy công ty phù hợp
            </h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">
              Không tìm thấy công ty nào với từ khóa &ldquo;{searchQuery}&rdquo;. Bạn đang làm việc hoặc từng làm việc tại đây? Hãy là người đầu tiên chia sẻ review!
            </p>
            <div className="mt-5">
              <Link
                href="/review/new"
                className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700"
              >
                Viết review cho công ty này
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
