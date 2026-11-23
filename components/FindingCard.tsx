"use client";

import { Finding, RiskLevel, getRiskColorClass, getRiskLabel } from "@/lib/risk";

interface FindingCardProps {
  finding: Finding;
  showSource?: boolean;
}

export default function FindingCard({ finding, showSource = true }: FindingCardProps) {
  const colors = getRiskColorClass(finding.risk);
  const label = getRiskLabel(finding.risk);

  return (
    <div className={`border-l-4 p-4 rounded-r-lg ${colors.bg} ${colors.border}`}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex-1">
          <blockquote className="text-gray-800 italic border-l-2 border-gray-300 pl-3 my-2">
            {finding.clauseQuote}
          </blockquote>
          <p className="text-gray-700">{finding.explanation}</p>
          <p className="text-cobalt-600 font-medium mt-2">Хуулийн иш: {finding.lawArticleId}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors.badgeBg} ${colors.badgeText}`}>
            {label}
          </span>
          {showSource && (
            <span className="text-xs text-gray-500">
              {finding.source === "lawyer" ? "Хуульч нэмсэн" : "AI тойм"}
            </span>
          )}
        </div>
      </div>
      <div className="pt-2 border-t border-gray-200">
        <p className="font-medium text-gray-900 mb-1">Зөвлөгөө:</p>
        <p className="text-gray-700">{finding.suggestion}</p>
        {finding.lawyerNote && (
          <p className="mt-2 text-sm text-cobalt-700 bg-cobalt-50 p-2 rounded">
            <span className="font-medium">Хуульчийн нэмэлт:</span> {finding.lawyerNote}
          </p>
        )}
      </div>
    </div>
  );
}