"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

type Finding = {
  id: string;
  clauseQuote: string;
  risk: "high" | "mid" | "low";
  explanation: string;
  lawArticleId: string;
  suggestion: string;
  source: "ai" | "lawyer";
  status: "pending" | "approved" | "edited" | "rejected";
  lawyerNote?: string;
};

type ReviewData = {
  id: string;
  type: "rental" | "labor";
  maskedText: string;
  findings: Finding[];
  overallRisk: "high" | "mid" | "low";
  slaDueAt: string;
};

export default function LawyerReviewPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showAddFinding, setShowAddFinding] = useState(false);
  const [newFinding, setNewFinding] = useState({
    clauseQuote: "",
    risk: "mid" as "high" | "mid" | "low",
    explanation: "",
    lawArticleId: "",
    suggestion: "",
  });
  const [generalNote, setGeneralNote] = useState("");

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await fetch(`/api/lawyer/review/${id}`);
        if (!res.ok) throw new Error("Хяналтын мэдээлэл авахад алдаа гарлаа");
        const reviewData = await res.json();
        setData(reviewData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [id]);

  const handleFindingAction = async (findingId: string, action: "approve" | "edit" | "reject", updatedFinding?: Partial<Finding>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/lawyer/findings/${findingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...updatedFinding }),
      });
      if (!res.ok) throw new Error("Дүгнэлт шинэчлэхэд алдаа гарлаа");
      const updated = await res.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              findings: prev.findings.map((f) => (f.id === findingId ? { ...f, ...updated } : f)),
            }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFinding = async () => {
    if (!newFinding.clauseQuote.trim() || !newFinding.explanation.trim()) {
      setError("Заалт ба тайлбарыг бөглөнө үү");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/lawyer/checks/${id}/findings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFinding),
      });
      if (!res.ok) throw new Error("Шинэ дүгнэлт нэмэхэд алдаа гарлаа");
      const finding = await res.json();
      setData((prev) =>
        prev ? { ...prev, findings: [...prev.findings, finding] } : null
      );
      setShowAddFinding(false);
      setNewFinding({ clauseQuote: "", risk: "mid", explanation: "", lawArticleId: "", suggestion: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveAll = async () => {
    if (!data || data.findings.some((f) => f.status === "pending")) {
      setError("Бүх дүгнэлт зөвшөөрөгдсөн/зассан/хассан байх ёстой");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/lawyer/checks/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generalNote, overallRisk: data.overallRisk }),
      });
      if (!res.ok) throw new Error("Баталж илгээхэд алдаа гарлаа");
      window.location.href = "/lawyer";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeRemaining = (dueAt: string) => {
    const due = new Date(dueAt).getTime();
    const now = Date.now();
    const diff = due - now;
    if (diff <= 0) return { expired: true, text: "SLA дууссан" };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { expired: false, text: `${hours}ц ${minutes}м үлдсэн` };
  };

  const riskColors = {
    high: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", label: "Өндөр" },
    mid: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300", label: "Дунд" },
    low: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", label: "Бага" },
  };

  const statusColors = {
    pending: { bg: "bg-gray-100", text: "text-gray-700", label: "Хүлээж байна" },
    approved: { bg: "bg-green-100", text: "text-green-800", label: "Зөвшөөрсөн" },
    edited: { bg: "bg-blue-100", text: "text-blue-800", label: "Зассан" },
    rejected: { bg: "bg-red-100", text: "text-red-800", label: "Хассан" },
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cobalt-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Хяналтын мэдээлэл ачааллаж байна...</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600">Мэдээлэл олдсонгүй</p>
        </div>
      </main>
    );
  }

  const timeRemain = getTimeRemaining(data.slaDueAt);

  return (
    <main className="min-h-screen bg-gray-50 py-4 px-4">
      <header className="max-w-7xl mx-auto mb-4 flex items-center justify-between">
        <Link href="/lawyer" className="flex items-center gap-3">
          <div className="w-8 h-10 bg-cobalt-500 clip-polygon" />
          <span className="text-2xl font-bold tracking-tight text-gray-900">Гэрээ шалгагч</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${timeRemain.expired ? "bg-red-100 text-red-800" : "bg-cobalt-100 text-cobalt-800"}`}>
            SLA: {timeRemain.text}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskColors[data.overallRisk].bg} ${riskColors[data.overallRisk].text}`}>
            Нийт эрсдэл: {riskColors[data.overallRisk].label}
          </span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="grid lg:grid-cols-[1fr_1fr] gap-4">
          {/* Left: Masked Text */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-4 h-[calc(100vh-140px)] sticky top-20 overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Гэрээний текст (далдлагдсан)</h3>
                <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">Далдлагдсан</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 max-h-[60vh] overflow-auto border border-gray-200">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 font-mono">
                  {data.maskedText}
                </pre>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <p className="font-medium">Далдлагдсан мэдээлэл:</p>
                <p className="mt-1">Регистр, утас, данс, нэр, хаяг, эрүүл мэндийн мэдээлэл сааралаар тэмдэглэгдсэн.</p>
              </div>
            </div>
          </div>

          {/* Right: AI Findings + Actions */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">AI дүгнэлтүүд</h3>
                <button
                  onClick={() => setShowAddFinding(true)}
                  className="px-3 py-1.5 text-sm bg-cobalt-500 text-white rounded-lg font-medium touch-target hover:bg-blue-600"
                >
                  + Шинэ дүгнэлт
                </button>
              </div>

              {showAddFinding && (
                <div className="mb-4 p-4 bg-cobalt-50 rounded-lg border border-cobalt-200 space-y-3">
                  <h4 className="font-medium text-gray-900">Шинэ дүгнэлт нэмэх</h4>
                  <textarea
                    value={newFinding.clauseQuote}
                    onChange={(e) => setNewFinding({ ...newFinding, clauseQuote: e.target.value })}
                    placeholder="Гэрээний заалт эсвэл хэсэг"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500"
                  />
                  <textarea
                    value={newFinding.explanation}
                    onChange={(e) => setNewFinding({ ...newFinding, explanation: e.target.value })}
                    placeholder="Тайбар / эрсдэл"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500"
                  />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <select
                      value={newFinding.risk}
                      onChange={(e) => setNewFinding({ ...newFinding, risk: e.target.value as "high" | "mid" | "low" })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500"
                    >
                      <option value="high">Өндөр эрсдэл</option>
                      <option value="mid">Дунд эрсдэл</option>
                      <option value="low">Бага эрсдэл</option>
                    </select>
                    <input
                      value={newFinding.lawArticleId}
                      onChange={(e) => setNewFinding({ ...newFinding, lawArticleId: e.target.value })}
                      placeholder="Хуулийн иш (жишээ: ГЭЗ 25.1)"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500"
                    />
                  </div>
                  <textarea
                    value={newFinding.suggestion}
                    onChange={(e) => setNewFinding({ ...newFinding, suggestion: e.target.value })}
                    placeholder="Зөвлөгөө / санал"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowAddFinding(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium touch-target hover:bg-gray-50"
                    >
                      Болих
                    </button>
                    <button
                      onClick={handleAddFinding}
                      disabled={saving}
                      className="px-4 py-2 bg-cobalt-500 text-white rounded-lg font-medium touch-target hover:bg-blue-600 disabled:opacity-50"
                    >
                      {saving ? "Хадгалаж байна..." : "Нэмэх"}
                    </button>
                  </div>
                </div>
              )}

              {data.findings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">AI дүгнэлт олдсонгүй</p>
              ) : (
                <div className="space-y-3 max-h-[50vh] overflow-auto">
                  {data.findings.map((finding) => (
                    <div
                      key={finding.id}
                      className={`p-4 rounded-xl border ${riskColors[finding.risk].bg} ${riskColors[finding.risk].border} relative`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${riskColors[finding.risk].bg} ${riskColors[finding.risk].text}`}>
                              {riskColors[finding.risk].label}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusColors[finding.status].bg} ${statusColors[finding.status].text}`}>
                              {statusColors[finding.status].label}
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
                              onClick={() => handleFindingAction(finding.id, "approve")}
                              disabled={saving}
                              className="px-3 py-1.5 text-xs bg-green-600 text-white rounded font-medium touch-target hover:bg-green-700 disabled:opacity-50"
                            >
                              Зөвшөөрөх
                            </button>
                            <button
                              onClick={() => {
                                const newExplanation = prompt("Засварлах тайлбар/зөвлөгөө:", finding.explanation);
                                if (newExplanation !== null) {
                                  handleFindingAction(finding.id, "edit", { explanation: newExplanation, lawyerNote: newExplanation });
                                }
                              }}
                              disabled={saving}
                              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded font-medium touch-target hover:bg-blue-700 disabled:opacity-50"
                            >
                              Засах
                            </button>
                            <button
                              onClick={() => handleFindingAction(finding.id, "reject")}
                              disabled={saving}
                              className="px-3 py-1.5 text-xs bg-red-600 text-white rounded font-medium touch-target hover:bg-red-700 disabled:opacity-50"
                            >
                              Хасах
                            </button>
                          </div>
                        )}

                        {finding.status !== "pending" && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Дүгнэлт: {statusColors[finding.status].label}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* General Note & Approve Button */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-3">Ерөнхий тэмдэглэл (хуульч)</h4>
              <textarea
                value={generalNote}
                onChange={(e) => setGeneralNote(e.target.value)}
                rows={3}
                placeholder="Иргэнд үзүүлэх ерөнхий санал, анхааруулга..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500"
              />
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleApproveAll}
                  disabled={submitting || data.findings.some((f) => f.status === "pending")}
                  className="w-full lg:w-auto px-6 py-3 bg-cobalt-500 text-white rounded-lg font-semibold text-base touch-target hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Баталж илгээж байна..." : "Баталж илгээх"}
                </button>
                {data.findings.some((f) => f.status === "pending") && (
                  <p className="text-sm text-red-600 mt-2">Бүх дүгнэлтийг зөвшөөрөх / засах / хасах хүртэл баталж илгээх боломжгүй.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}