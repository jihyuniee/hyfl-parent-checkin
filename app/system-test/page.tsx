"use client";

import { useState } from "react";
import { CheckCircle2, Gauge, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

type Result = { success: number; failed: number; totalMs: number; averageMs: number; p95Ms: number; verified: number };

export default function SystemTestPage() {
  const [running, setRunning] = useState(false); const [result, setResult] = useState<Result>(); const [error, setError] = useState("");
  const run = async () => {
    setRunning(true); setResult(undefined); setError("");
    const runId = `hyfl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; const started = performance.now();
    const responses = await Promise.all(Array.from({ length: 250 }, async (_, index) => { const oneStarted = performance.now(); try { const response = await fetch("/api/system-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runId, requestNo: index + 1 }) }); return { ok: response.ok, ms: performance.now() - oneStarted }; } catch { return { ok: false, ms: performance.now() - oneStarted }; } }));
    const totalMs = performance.now() - started; const sorted = responses.map(r => r.ms).sort((a,b) => a-b);
    const cleanup = await fetch(`/api/system-test?runId=${encodeURIComponent(runId)}`, { method: "DELETE" }); const cleanupData = await cleanup.json();
    const success = responses.filter(r => r.ok).length; const next = { success, failed: 250-success, totalMs: Math.round(totalMs), averageMs: Math.round(sorted.reduce((a,b)=>a+b,0)/250), p95Ms: Math.round(sorted[Math.floor(sorted.length*.95)-1]), verified: Number(cleanupData.count??0) };
    setResult(next); if (success !== 250 || next.verified !== 250) setError("일부 요청이 정상 저장되지 않았습니다. 행사 전 추가 점검이 필요합니다."); setRunning(false);
  };
  return <main className="system-test-page"><section className="system-test-card"><img src="/hyfl-logo.png" alt="한영외국어고등학교"/><p className="eyebrow">SYSTEM READINESS TEST</p><h1>250명 동시 체크인 점검</h1><p className="system-test-intro">학생 명단이나 실제 참석 기록은 건드리지 않고, 동일한 데이터베이스에 250개의 요청을 동시에 보내 저장 속도와 누락 여부를 확인합니다. 테스트 자료는 확인 직후 자동 삭제됩니다.</p><div className="system-test-points"><span><ShieldCheck/>실제 명단 보호</span><span><Gauge/>250개 동시 요청</span><span><CheckCircle2/>저장 건수 재확인</span></div><Button className="primary-action" onClick={run} disabled={running}>{running?<><LoaderCircle className="spin"/>점검 중…</>:"동시접속 테스트 시작"}</Button>{result&&<div className={`system-test-result ${result.success===250&&result.verified===250?"pass":"fail"}`}><strong>{result.success===250&&result.verified===250?"정상 통과":"점검 필요"}</strong><dl><div><dt>성공 요청</dt><dd>{result.success} / 250</dd></div><div><dt>저장 확인</dt><dd>{result.verified} / 250</dd></div><div><dt>전체 소요</dt><dd>{(result.totalMs/1000).toFixed(2)}초</dd></div><div><dt>95% 응답</dt><dd>{result.p95Ms}ms 이내</dd></div></dl></div>}{error&&<p className="submit-error">{error}</p>}<a href="/">체크인 화면으로 돌아가기</a></section></main>;
}
