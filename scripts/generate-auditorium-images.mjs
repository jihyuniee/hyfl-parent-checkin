import QRCode from "qrcode";
import { readFileSync, writeFileSync } from "node:fs";

const url = "https://hyfl-parent-checkin.jihyun178.workers.dev/";
const logo = readFileSync(new URL("../public/hyfl-logo.png", import.meta.url)).toString("base64");
const qr = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "H", margin: 3, color: { dark: "#111310", light: "#ffffff" } });
const qrBody = qr.replace(/^.*?<svg[^>]*>/s, "").replace(/<\/svg>\s*$/s, "");

for (const [grade, date] of [[1,"2026. 09. 03."],[2,"2026. 09. 04."]]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="#f6f5f2"/><rect x="54" y="44" width="1812" height="992" fill="#ffffff" stroke="#d8d6cf" stroke-width="2"/>
  <image href="data:image/png;base64,${logo}" x="104" y="80" width="430" height="80" preserveAspectRatio="xMinYMid meet"/>
  <text x="1815" y="112" text-anchor="end" fill="#77766f" font-family="Georgia, 'Times New Roman', serif" font-size="19" letter-spacing="6">H Y F L  P A R E N T  M E E T I N G</text>
  <line x1="104" y1="190" x2="1815" y2="190" stroke="#d6d4cd" stroke-width="1"/>
  <text x="315" y="335" text-anchor="middle" fill="#77766f" font-family="Georgia, 'Times New Roman', serif" font-size="18" letter-spacing="4">${date}</text>
  <text x="315" y="395" text-anchor="middle" fill="#181916" font-family="Arial, 'Noto Sans KR', sans-serif" font-size="31" font-weight="500">2026학년도 ${grade}학년 학부모 총회</text>
  <line x1="225" y1="445" x2="405" y2="445" stroke="#8e8b82" stroke-width="1"/>
  <text x="315" y="535" text-anchor="middle" fill="#242520" font-family="Arial, 'Noto Sans KR', sans-serif" font-size="29" font-weight="500">QR 코드를 촬영해 주세요</text>
  <text x="315" y="586" text-anchor="middle" fill="#77766f" font-family="Arial, 'Noto Sans KR', sans-serif" font-size="20">자녀의 반과 이름을 입력하면</text>
  <text x="315" y="620" text-anchor="middle" fill="#77766f" font-family="Arial, 'Noto Sans KR', sans-serif" font-size="20">참석 등록이 완료됩니다.</text>
  <svg x="785" y="200" width="800" height="800" viewBox="0 0 41 41">${qrBody}</svg>
  <line x1="104" y1="955" x2="625" y2="955" stroke="#d6d4cd" stroke-width="1"/>
  <text x="104" y="992" fill="#77766f" font-family="Arial, sans-serif" font-size="15" letter-spacing="1">hyfl-parent-checkin.jihyun178.workers.dev</text>
  </svg>`;
  writeFileSync(new URL(`../public/auditorium-grade${grade}.svg`, import.meta.url), svg);
}
