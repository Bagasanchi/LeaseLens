"use client";

import { RiskLevel, getRiskColorClass, getRiskLabel } from "@/lib/risk";

interface RiskPillProps {
  risk: RiskLevel;
  showScore?: boolean;
  score?: number;
  size?: "sm" | "md" | "lg";
}

export default function RiskPill({
  risk,
  showScore = false,
  score,
  size = "md",
}: RiskPillProps) {
  const colors = getRiskColorClass(risk);
  const label = getRiskLabel(risk);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${colors.badgeBg} ${colors.badgeText} ${sizeClasses[size]}`}
    >
      <span className={`w-2 h-2 rounded-full ${
        risk === "high" ? "bg-red-500" : risk === "mid" ? "bg-yellow-500" : "bg-green-500"
      }`} />
      <span>{label}</span>
      {showScore && score !== undefined && (
        <span className="opacity-75">({score}%)</span>
      )}
    </span>
  );
}