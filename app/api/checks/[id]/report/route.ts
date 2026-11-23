import { NextResponse } from "next/server";
import { getCheck, getFindings, getLawyer, getQuestions } from "@/lib/store";
import { calculateOverallRisk, getRiskLabel } from "@/lib/risk";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const check = getCheck(id);

  if (!check) {
    return NextResponse.json({ error: "Шалгалт олдсонгүй" }, { status: 404 });
  }

  const findings = getFindings(id).filter((f) => f.status !== "rejected");
  const risk = calculateOverallRisk(findings);
  const lawyer = check.lawyerId ? getLawyer(check.lawyerId) : undefined;
  const questions = getQuestions(id);

  const url = new URL(req.url);
  const format = url.searchParams.get("format");

  if (format !== "print") {
    return NextResponse.json({
      check: {
        id: check.id,
        type: check.type,
        package: check.package,
        status: check.status,
        createdAt: check.createdAt,
        deliveredAt: check.deliveredAt,
        overallRisk: risk.overallRisk,
        riskScore: risk.riskScore,
        pages: check.pages,
      },
      lawyer: lawyer
        ? { name: lawyer.name, licenseNumber: lawyer.licenseNumber }
        : null,
      lawyerName: lawyer?.name ?? "",
      lawyerLicense: lawyer?.licenseNumber ?? "",
      lawyerNote: check.lawyerNote ?? "",
      overallRisk: risk.overallRisk,
      findings: findings.map((f) => ({
        id: f.id,
        clauseQuote: f.clauseQuote,
        risk: f.risk,
        explanation: f.explanation,
        lawArticleId: f.lawArticleId,
        suggestion: f.suggestion,
        source: f.source,
        lawyerNote: f.lawyerNote,
      })),
      questions,
      summary: {
        high: risk.highRiskCount,
        mid: risk.midRiskCount,
        low: risk.lowRiskCount,
        recommendations: risk.recommendations,
      },
    });
  }

  // Printable document (browser "Save as PDF" produces the PDF)
  const rows = findings
    .map(
      (f, i) => `
      <tr>
        <td style="padding:12px;border:1px solid #e5e7eb;vertical-align:top">${i + 1}</td>
        <td style="padding:12px;border:1px solid #e5e7eb;vertical-align:top"><span style="padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600;background:${
          f.risk === "high" ? "#fee2e2" : f.risk === "mid" ? "#fef3c7" : "#dcfce7"
        };color:${f.risk === "high" ? "#991b1b" : f.risk === "mid" ? "#92400e" : "#166534"}">${getRiskLabel(f.risk)}</span></td>
        <td style="padding:12px;border:1px solid #e5e7eb;vertical-align:top;white-space:pre-wrap">${escapeHtml(f.clauseQuote)}</td>
        <td style="padding:12px;border:1px solid #e5e7eb;vertical-align:top;white-space:pre-wrap">${escapeHtml(f.explanation)}</td>
        <td style="padding:12px;border:1px solid #e5e7eb;vertical-align:top">${escapeHtml(f.lawArticleId)}</td>
        <td style="padding:12px;border:1px solid #e5e7eb;vertical-align:top;white-space:pre-wrap">${escapeHtml(f.suggestion)}${
          f.lawyerNote
            ? `<div style="margin-top:8px;padding:8px;background:#eff6ff;border-radius:6px;font-size:12px"><strong>Хуульчийн тэмдэглэл:</strong> ${escapeHtml(f.lawyerNote)}</div>`
            : ""
        }</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="mn">
<head>
  <meta charset="utf-8" />
  <title>LeaseLens тайлан - ${check.id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #111827; line-height: 1.5; }
    h1 { color: #1d4ed8; margin-bottom: 4px; }
    .meta { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { background: #f9fafb; padding: 12px; border: 1px solid #e5e7eb; text-align: left; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    @media print { body { margin: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:20px">
    <button onclick="window.print()" style="padding:10px 20px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer">PDF болгон хадгалах / Хэвлэх</button>
  </div>
  <h1>LeaseLens - Хуулийн эрсдэлийн тайлан</h1>
  <div class="meta">Шалгалт: ${check.id} · ${check.type === "rental" ? "Түрээс" : "Хөдөлмөр"} · ${new Date(check.createdAt).toLocaleString("mn-MN")}</div>

  <div class="card">
    <h2 style="margin-top:0">Ерөнхий дүгнэлт</h2>
    <p>Нийт эрсдэлийн түвшин: <strong>${getRiskLabel(risk.overallRisk)}</strong> (${risk.riskScore}/100)</p>
    <p>Өндөр: ${risk.highRiskCount} · Дунд: ${risk.midRiskCount} · Бага: ${risk.lowRiskCount}</p>
    ${lawyer ? `<p>Хянасан хуульч: <strong>${escapeHtml(lawyer.name)}</strong> (${escapeHtml(lawyer.licenseNumber)})</p>` : ""}
    ${check.lawyerNote ? `<p>Хуульчийн эцсийн тэмдэглэл: ${escapeHtml(check.lawyerNote)}</p>` : ""}
  </div>

  <div class="card">
    <h2 style="margin-top:0">Олдсон эрсдэлүүд</h2>
    <table>
      <thead><tr><th>#</th><th>Эрсдэл</th><th>Ишлэл</th><th>Тайлбар</th><th>Хууль</th><th>Зөвлөмж</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" style="padding:20px;text-align:center;color:#6b7280">Эрсдэл олдсонгүй</td></tr>'}</tbody>
    </table>
  </div>

  ${
    risk.recommendations.length
      ? `<div class="card"><h2 style="margin-top:0">Зөвлөмж</h2><ul>${risk.recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul></div>`
      : ""
  }

  <div class="footer">
    <p><strong>Анхааруулга:</strong> Энэхүү тайлан нь мэдээллийн зориулалттай бөгөөд хууль зүйн албан зөвлөгөө биш. Эцсийн шийдвэр гаргахын өмнө мэргэжлийн хуульчтай зөвлөлдөнө үү.</p>
    <p>LeaseLens · Нууцлал хамгаалагдсан · ${new Date().toLocaleString("mn-MN")}</p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="leaselens-report-${id}.html"`,
    },
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
