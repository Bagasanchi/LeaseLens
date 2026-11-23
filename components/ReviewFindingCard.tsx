"use client";

import { Finding, RiskLevel, getRiskColorClass, getRiskLabel } from "@/lib/risk";

interface ReviewFindingCardProps {
  finding: Finding;
  onAction: (findingId: string, action: "approve" | "edit" | "reject", updated?: Partial<Finding>) => void;
  saving?: boolean;
}

export default function ReviewFindingCard({ finding, onAction, saving }: ReviewFindingCardProps) {
  const colors = getRiskColorClass(finding.risk);
  const label = getRiskLabel(finding.risk);

  const statusColors = {
    pending: { bg: "bg-gray-100", text: "text-gray-700", label: "Хүлээж байна" },
    approved: { bg: "bg-green-100", text: "text-green-800", label: "Зөвшөөрсөн" },
    edited: { bg: "bg-blue-100", text: "text-blue-800", label: "Зассан" },
    rejected: { bg: "bg-red-100", text: "text-red-800", label: "Хассан" },
  };
  const statusColor = statusColors[finding.status];

  return (
    <div className={`p-4 rounded-xl border ${colors.bg} ${colors.border} relative`}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors.badgeBg} ${colors.badgeText}`}>
              {label}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusColor.bg} ${statusColor.text}`}>
              {statusColor.label}
            </span>
            <span className="text-xs text-gray-500">
              {finding.source === "lawyer" ? "Хуульч нэмсэн" : "AI тойм"}
            </span>
          </div>
          <blockquote className="text-gray-800 italic border-l-2 border-gray-300 pl-3 my-2 text-sm">
            {finding.clauseQuote}
          </blockquote>
          <p className="text-sm text-gray-700">{finding.explanation}</p>
          <p className="text-xs text-cobalt-600 mt-1">Хуулийн иш: {finding.lawArticleId || "—"}</p>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-200 space-y-2">
        <p className="font-medium text-gray-900 text-sm">Зөвлөгөө:</p>
        <p className="text-sm text-gray-700">{finding.suggestion}</p>

        {finding.status === "edited" && finding.lawyerNote && (
          <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
            <span className="font-medium">Засвар:</span> {finding.lawyerNote}
          </p>
        )}

        {finding.status === "pending" && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onAction(finding.id, "approve")}
              disabled={saving}
              className="px-3 py-1.5 text-xs bg-green-600 text-white rounded font-medium touch-target hover:bg-green-700 disabled:opacity-50"
            >
              Зөвшөөрөх
            </button>
            <button
              onClick={() => {
                const newExplanation = prompt("Засварлах тайлбар/зөвлөгөө:", finding.explanation);
                if (newExplanation !== null) {
                  onAction(finding.id, "edit", { explanation: newExplanation, lawyerNote: newExplanation });
                }
              }}
              disabled={saving}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded font-medium touch-target hover:bg-blue-700 disabled:opacity-50"
            >
              Засах
            </button>
            <button
              onClick={() => onAction(finding.id, "reject")}
              disabled={saving}
              className="px-3 py-1.5 text-xs bg-red-600 text-white rounded font-medium touch-target hover:bg-red-700 disabled:opacity-50"
            >
              Хасах
            </button>
          </div>
        )}

        {finding.status !== "pending" && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Дүгнэлт: {statusColor.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}