import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LinkedOut — Nền tảng Review Môi trường & Văn hóa Công ty",
  description:
    "Đọc vị mọi công ty tại Việt Nam — Xem điểm tốt, điểm xấu, lương thưởng, chế độ đãi ngộ và văn hóa doanh nghiệp do chính nhân viên chia sẻ hoàn toàn ẩn danh.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${beVietnamPro.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto max-w-7xl px-4">
            <p className="font-semibold text-zinc-700 dark:text-zinc-300">
              LinkedOut — Nền tảng đánh giá môi trường & văn hóa doanh nghiệp độc lập
            </p>
            <p className="mt-1 text-[11px] text-zinc-400">
              Mọi nội dung chia sẻ đều được bảo vệ danh tính 100%. Thông tin do cộng đồng người lao động đóng góp.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
