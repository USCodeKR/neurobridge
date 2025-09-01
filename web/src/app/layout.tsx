import type { Metadata } from "next";
import Header from "@/components/Header"; // 공통 헤더 컴포넌트
import "./globals.css";

export const metadata: Metadata = {
  title: "Handscope",
  description: "AI 기반 뇌질환 조기검사 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
