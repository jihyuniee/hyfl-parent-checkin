"use client";

export default function DisplayPage() {
  const today = new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Seoul",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const grade = today === "2026-09-04" ? 2 : 1;
  return <main className="display-image-page"><img src={`/auditorium-grade${grade}.svg`} alt={`${grade}학년 학부모 총회 참석 등록 QR 안내`}/></main>;
}
