/**
 * Risk Calculation logic for contract review
 * Evaluates risk levels based on findings, clause weights, and law compliance
 */

export type RiskLevel = "high" | "mid" | "low";

export interface Finding {
  id: string;
  clauseQuote: string;
  risk: RiskLevel;
  explanation: string;
  lawArticleId: string;
  suggestion: string;
  source: "ai" | "lawyer";
  status: "pending" | "approved" | "edited" | "rejected";
  lawyerNote?: string;
}

export interface RiskAnalysisResult {
  overallRisk: RiskLevel;
  riskScore: number; // 0-100 scale
  highRiskCount: number;
  midRiskCount: number;
  lowRiskCount: number;
  criticalIssues: string[];
  recommendations: string[];
}

// Weights for different risk levels
const RISK_WEIGHTS: Record<RiskLevel, number> = {
  high: 25,
  mid: 10,
  low: 3,
};

// Thresholds for overall risk determination
const HIGH_RISK_THRESHOLD = 40; // Score >= 40 or >= 2 high risk findings
const MID_RISK_THRESHOLD = 15;  // Score >= 15 or >= 1 high risk finding or >= 2 mid risk findings

export function calculateOverallRisk(findings: Finding[]): RiskAnalysisResult {
  // Only count non-rejected findings
  const activeFindings = findings.filter((f) => f.status !== "rejected");

  const highRiskCount = activeFindings.filter((f) => f.risk === "high").length;
  const midRiskCount = activeFindings.filter((f) => f.risk === "mid").length;
  const lowRiskCount = activeFindings.filter((f) => f.risk === "low").length;

  // Calculate total risk score (max capped at 100)
  const rawScore =
    highRiskCount * RISK_WEIGHTS.high +
    midRiskCount * RISK_WEIGHTS.mid +
    lowRiskCount * RISK_WEIGHTS.low;

  const riskScore = Math.min(100, rawScore);

  // Determine overall risk level based on score and counts
  let overallRisk: RiskLevel = "low";

  if (highRiskCount >= 2 || riskScore >= HIGH_RISK_THRESHOLD) {
    overallRisk = "high";
  } else if (highRiskCount === 1 || midRiskCount >= 2 || riskScore >= MID_RISK_THRESHOLD) {
    overallRisk = "mid";
  }

  // Extract critical issues from high risk findings
  const criticalIssues = activeFindings
    .filter((f) => f.risk === "high")
    .map((f) => f.explanation);

  // Generate high-level recommendations
  const recommendations: string[] = [];
  if (highRiskCount > 0) {
    recommendations.push(
      `Өндөр эрсдэлтэй ${highRiskCount} заалтыг заавал өөрчлөх эсвэл цуцлах шаардлагатай.`
    );
  }
  if (midRiskCount > 0) {
    recommendations.push(
      `Дунд эрсдэлтэй ${midRiskCount} заалтыг талууд харилцан тохиролцож тодорхой болгох саналтай.`
    );
  }
  if (activeFindings.some((f) => f.lawArticleId)) {
    recommendations.push(
      "Хуулийн заалтуудыг дахин нягталж, хуульчийн зөвлөмжийг дагана уу."
    );
  }

  return {
    overallRisk,
    riskScore,
    highRiskCount,
    midRiskCount,
    lowRiskCount,
    criticalIssues,
    recommendations,
  };
}

export function getRiskColorClass(risk: RiskLevel): {
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
  badgeText: string;
} {
  switch (risk) {
    case "high":
      return {
        bg: "bg-red-50",
        text: "text-red-800",
        border: "border-red-300",
        badgeBg: "bg-red-100",
        badgeText: "text-red-800",
      };
    case "mid":
      return {
        bg: "bg-yellow-50",
        text: "text-yellow-800",
        border: "border-yellow-300",
        badgeBg: "bg-yellow-100",
        badgeText: "text-yellow-800",
      };
    case "low":
      return {
        bg: "bg-green-50",
        text: "text-green-800",
        border: "border-green-300",
        badgeBg: "bg-green-100",
        badgeText: "text-green-800",
      };
  }
}

export function getRiskLabel(risk: RiskLevel): string {
  switch (risk) {
    case "high":
      return "Өндөр эрсдэл";
    case "mid":
      return "Дунд эрсдэл";
    case "low":
      return "Бага эрсдэл";
  }
}