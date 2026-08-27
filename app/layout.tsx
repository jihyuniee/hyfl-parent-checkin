import type { Metadata } from "next";
import "./globals.css";
import "./admin.css";
import "./logo.css";
import "./charts.css";
export const metadata: Metadata = { title: "한영외고 학부모 행사 참석 관리", description: "학부모 행사 현장 QR 체크인과 학년·반별 참석 현황 관리", icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" } };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ko"><body>{children}</body></html>}
