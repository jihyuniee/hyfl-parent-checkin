import QRCode from "qrcode";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get("target") || `${requestUrl.origin}/`;
  const svg = await QRCode.toString(target, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 2,
    width: 900,
    color: { dark: "#102c4b", light: "#ffffff" },
  });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Disposition": requestUrl.searchParams.get("download") === "1" ? 'attachment; filename="hyfl-parent-checkin-qr.svg"' : "inline",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
