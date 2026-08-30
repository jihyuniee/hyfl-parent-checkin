import QRCode from "qrcode";
import { readFileSync, writeFileSync } from "node:fs";

const url = "https://hyfl-parent-checkin.jihyun178.workers.dev/";
const logo = readFileSync(new URL("../public/hyfl-logo.png", import.meta.url)).toString("base64");
const qr = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "H", margin: 3, color: { dark: "#111310", light: "#ffffff" } });
const qrViewBox = qr.match(/viewBox="([^"]+)"/)?.[1];
if (!qrViewBox) throw new Error("QR viewBox를 확인할 수 없습니다.");
const qrBody = qr.replace(/^.*?<svg[^>]*>/s, "").replace(/<\/svg>\s*$/s, "");

writeFileSync(
  new URL("../public/hyfl-logo-embedded.svg", import.meta.url),
  `<svg xmlns="http://www.w3.org/2000/svg" width="367" height="71" viewBox="0 0 367 71"><image href="data:image/png;base64,${logo}" width="367" height="71"/></svg>`,
);

for (const [grade, date] of [[1,"2026. 09. 03."],[2,"2026. 09. 04."]]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="#f6f5f2"/><rect x="54" y="44" width="1812" height="992" fill="#ffffff" stroke="#d8d6cf" stroke-width="2"/>
  <image href="data:image/png;base64,${logo}" x="104" y="80" width="430" height="80" preserveAspectRatio="xMinYMid meet"/>
  <text x="1815" y="112" text-anchor="end" fill="#77766f" font-family="Georgia, 'Times New Roman', serif" font-size="19" letter-spacing="6">H Y F L  P A R E N T  M E E T I N G</text>
  <line x1="104" y1="190" x2="1815" y2="190" stroke="#d6d4cd" stroke-width="1"/>
  <text x="315" y="325" text-anchor="middle" fill="#4d4d48" font-family="Georgia, 'Times New Roman', serif" font-size="23" font-weight="700" letter-spacing="5">${date}</text>
  <text x="315" y="398" text-anchor="middle" fill="#111b27" font-family="'Noto Sans KR', Arial, sans-serif" font-size="40" font-weight="700">2026학년도 ${grade}학년</text>
  <text x="315" y="447" text-anchor="middle" fill="#111b27" font-family="'Noto Sans KR', Arial, sans-serif" font-size="40" font-weight="700">학부모 총회</text>
  <line x1="205" y1="493" x2="425" y2="493" stroke="#72736e" stroke-width="2"/>
  <text x="315" y="575" text-anchor="middle" fill="#102c4b" font-family="'Noto Sans KR', Arial, sans-serif" font-size="37" font-weight="700">QR 코드를 촬영해 주세요</text>
  <text x="315" y="635" text-anchor="middle" fill="#3f454c" font-family="'Noto Sans KR', Arial, sans-serif" font-size="25" font-weight="500">자녀의 반과 이름을 입력하면</text>
  <text x="315" y="676" text-anchor="middle" fill="#3f454c" font-family="'Noto Sans KR', Arial, sans-serif" font-size="25" font-weight="500">참석 등록이 완료됩니다.</text>
  <svg x="785" y="200" width="800" height="800" viewBox="${qrViewBox}" shape-rendering="crispEdges">${qrBody}</svg>
  <line x1="104" y1="955" x2="625" y2="955" stroke="#d6d4cd" stroke-width="1"/>
  <text x="104" y="992" fill="#77766f" font-family="Arial, sans-serif" font-size="15" letter-spacing="1">hyfl-parent-checkin.jihyun178.workers.dev</text>
  </svg>`;
  writeFileSync(new URL(`../public/auditorium-grade${grade}.svg`, import.meta.url), svg);
}

const testUrl = "https://hyfl-parent-checkin.jihyun178.workers.dev/?grade=1&preview=1";
const testQr = await QRCode.toString(testUrl, { type: "svg", errorCorrectionLevel: "H", margin: 3, color: { dark: "#111310", light: "#ffffff" } });
const testViewBox = testQr.match(/viewBox="([^"]+)"/)?.[1];
if (!testViewBox) throw new Error("테스트 QR viewBox를 확인할 수 없습니다.");
const testQrBody = testQr.replace(/^.*?<svg[^>]*>/s, "").replace(/<\/svg>\s*$/s, "");
const gradeOne = readFileSync(new URL("../public/auditorium-grade1.svg", import.meta.url), "utf8");
const testSvg = gradeOne
  .replace("2026. 09. 03.", "사전 점검용 · 1학년")
  .replace(
    /<svg x="785" y="200" width="800" height="800" viewBox="[^"]+" shape-rendering="crispEdges">[\s\S]*?<\/svg>/,
    `<svg x="785" y="200" width="800" height="800" viewBox="${testViewBox}" shape-rendering="crispEdges">${testQrBody}</svg>`,
  )
  .replace(/<\/svg>\s*$/, '<rect x="104" y="210" width="210" height="48" rx="24" fill="#102c4b"/><text x="209" y="242" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="2">TEST QR</text></svg>');
writeFileSync(new URL("../public/auditorium-test.svg", import.meta.url), testSvg);
