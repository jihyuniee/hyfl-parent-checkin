"use client";

import { useEffect, useState } from "react";

type EventRecord = { title: string; eventDate: string };

export default function DisplayPage() {
  const [event, setEvent] = useState<EventRecord>();
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(location.origin);
    fetch("/api/checkin").then(r => r.json()).then(data => setEvent(data.event)).catch(() => undefined);
  }, []);
  return <main className="display-screen">
    <header><img src="/hyfl-logo.png" alt="한영외국어고등학교"/><span>HANYOUNG FOREIGN LANGUAGE HIGH SCHOOL</span></header>
    <section>
      <div className="display-copy">
        <p>2026 PARENT MEETING</p>
        <h1>{event?.title ?? "학부모 총회 참석 등록"}</h1>
        <div className="display-rule"/>
        <h2>QR 코드를 촬영하여<br/>참석을 등록해 주세요.</h2>
        <ol><li>자녀의 반을 선택해 주세요.</li><li>자녀 이름과 참석 인원을 입력해 주세요.</li><li>등록 완료 화면을 확인해 주세요.</li></ol>
      </div>
      <div className="qr-panel">
        <img src={origin?`/api/qr?target=${encodeURIComponent(origin+"/")}`:"/api/qr"} alt="학부모 행사 참석 등록 QR 코드"/>
        <strong>참석 등록</strong><span>{origin.replace(/^https?:\/\//,"")}</span>
      </div>
    </section>
    <footer><span>등록이 어려우신 경우 안내 담당자에게 말씀해 주세요.</span><a href="/api/qr?download=1" download>QR 이미지 저장</a></footer>
  </main>;
}
