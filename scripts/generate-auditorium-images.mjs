import QRCode from "qrcode";
import { readFileSync, writeFileSync } from "node:fs";

const url = "https://hyfl-parent-checkin.jihyun178.workers.dev/";
const logo = readFileSync(new URL("../public/hyfl-logo.png", import.meta.url)).toString("base64");
const qr = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "H", margin: 2, color: { dark: "#0d2947", light: "#ffffff" } });
const qrBody = qr.replace(/^.*?<svg[^>]*>/s, "").replace(/<\/svg>\s*$/s, "");

for (const [grade, date] of [[1,"2026. 09. 03."],[2,"2026. 09. 04."]]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="#f7f9fb"/><rect width="1920" height="16" fill="#153b63"/>
  <image href="data:image/png;base64,${logo}" x="80" y="50" width="530" height="105" preserveAspectRatio="xMinYMid meet"/>
  <text x="1835" y="105" text-anchor="end" fill="#748294" font-family="Arial, 'Noto Sans KR', sans-serif" font-size="23" letter-spacing="3">PARENT MEETING · ${date}</text>
  <text x="320" y="322" text-anchor="middle" fill="#173b62" font-family="Arial, 'Noto Sans KR', sans-serif" font-size="31" font-weight="700">2026학년도 ${grade}학년</text>
  <text x="320" y="382" text-anchor="middle" fill="#10243b" font-family="Arial, 'Noto Sans KR', sans-serif" font-size="51" font-weight="700">학부모 총회</text>
  <line x1="205" y1="432" x2="435" y2="432" stroke="#b9c5d1" stroke-width="2"/>
  <text x="320" y="515" text-anchor="middle" fill="#30465e" font-family="Arial, 'Noto Sans KR', sans-serif" font-size="35" font-weight="700">QR 코드를 촬영해 주세요</text>
  <text x="320" y="570" text-anchor="middle" fill="#6d7b8b" font-family="Arial, 'Noto Sans KR', sans-serif" font-size="24">자녀의 반과 이름을 입력하면</text>
  <text x="320" y="608" text-anchor="middle" fill="#6d7b8b" font-family="Arial, 'Noto Sans KR', sans-serif" font-size="24">참석 등록이 완료됩니다.</text>
  <rect x="690" y="68" width="990" height="990" rx="34" fill="#ffffff" stroke="#dce3ea" stroke-width="3"/>
  <svg x="725" y="103" width="920" height="920" viewBox="0 0 41 41">${qrBody}</svg>
  <text x="320" y="905" text-anchor="middle" fill="#173b62" font-family="Arial, 'Noto Sans KR', sans-serif" font-size="23" font-weight="700">한영외국어고등학교</text>
  <text x="320" y="947" text-anchor="middle" fill="#8290a0" font-family="Arial, sans-serif" font-size="17">hyfl-parent-checkin.jihyun178.workers.dev</text>
  </svg>`;
  writeFileSync(new URL(`../public/auditorium-grade${grade}.svg`, import.meta.url), svg);
}
