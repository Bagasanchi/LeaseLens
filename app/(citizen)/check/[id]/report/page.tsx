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
  lawyerNote?: string;
};

type Question = {
  id: string;
  from: "citizen" | "lawyer";
  body: string;
  at: string;
};

export default function CheckReportPage() {
  const params = useParams();
  const id = params.id as string;
  const [findings, setFindings] = useState<Finding[]>([]);
  const [overallRisk, setOverallRisk] = useState<"high" | "mid" | "low">("low");
  const [lawyerName, setLawyerName] = useState("");
  const [lawyerLicense, setLawyerLicense] = useState("");
  const [lawyerNote, setLawyerNote] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/checks/${id}/report`);
        if (!res.ok) throw new Error("Тайлан авахад алдаа гарлаа");
        const data = await res.json();
        setFindings(data.findings || []);
        setOverallRisk(data.overallRisk || "low");
        setLawyerName(data.lawyerName || "");
        setLawyerLicense(data.lawyerLicense || "");
        setLawyerNote(data.lawyerNote || "");
        setQuestions(data.questions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const sendQuestion = async () => {
    if (!newQuestion.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/checks/${id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newQuestion.trim() }),
      });
      if (!res.ok) throw new Error("Асуулт илгээхэд алдаа гарлаа");
      const data = await res.json();
      setQuestions([...questions, data]);
      setNewQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setSending(false);
    }
  };

  const downloadPDF = async () => {
    try {
      const res = await fetch(`/api/checks/${id}/report?format=pdf`);
      if (!res.ok) throw new Error("PDF татах алдаа");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Гэрээ_шалгалтын_тайлан_${id.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF татах алдаа");
    }
  };

  const riskColors = {
    high: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", label: "Өндөр" },
    mid: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300", label: "Дунд" },
    low: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", label: "Бага" },
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cobalt-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Тайлан ачааллаж байна...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <header className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <Link href={`/check/${id}`} className="flex items-center gap-3">
          <div className="w-8 h-10 bg-cobalt-500 clip-polygon" />
          <span className="text-2xl font-bold tracking-tight text-gray-900">Гэрээ шалгагч</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadPDF}
            className="border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium touch-target hover:bg-gray-50"
          >
            PDF татах
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cobalt-100 text-cobalt-700 text-sm font-medium mb-2">
                <span className="w-2 h-2 bg-cobalt-500 rounded-full" />
                Хуульч хянаж баталсан
              </div>
              <h2 className="font-serif font-medium text-2xl text-gray-900">Гэрээ шалгалтын тайлан</h2>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${riskColors[overallRisk].border} ${riskColors[overallRisk].bg} ${riskColors[overallRisk].text}`}>
              <span className="font-semibold">Эрсдэл: {riskColors[overallRisk].label}</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Хуульч</p>
              <p className="font-medium text-gray-900">{lawyerName || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Үнэмлэх №</p>
              <p className="font-medium text-gray-900">{lawyerLicense || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Баталгаажуулсан огноо</p>
              <p className="font-medium text-gray-900">{new Date().toLocaleDateString("mn-MN")}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Шалгалтын ID</p>
              <p className="font-mono text-sm text-gray-900">{id}</p>
            </div>
          </div>

          {lawyerNote && (
            <div className="mb-6 p-4 bg-cobalt-50 border border-cobalt-200 rounded-lg">
              <p className="font-medium text-cobalt-800 mb-1">Хуульчийн ерөнхий тэмдэглэл:</p>
              <p className="text-cobalt-700">{lawyerNote}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Заалт бүрийн шинжилгээ</h3>
          {findings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Эрсдэлтэй заалт олдсонгүй.</p>
          ) : (
            <div className="space-y-4">
              {findings.map((finding) => (
                <div key={finding.id} className={`border-l-4 p-4 rounded-r-lg ${riskColors[finding.risk].bg} ${riskColors[finding.risk].border}`}>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <blockquote className="text-gray-800 italic border-l-2 border-gray-300 pl-3 my-2">
                        {finding.clauseQuote}
                      </blockquote>
                      <p className="text-gray-700">{finding.explanation}</p>
                      <p className="text-cobalt-600 font-medium mt-2">Хуулийн иш: {finding.lawArticleId}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${riskColors[finding.risk].bg} ${riskColors[finding.risk].text}`}>
                        {riskColors[finding.risk].label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {finding.source === "lawyer" ? "Хуульч нэмсэн" : "AI тойм"}
                      </span>
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
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Дутуу заалтууд</h3>
          <p className="text-gray-600 mb-4">Дараах заалтууд гэрээнд байх ёстой боловч олдсонгүй (хүснэгтээр):</p>
          <ul className="space-y-2 list-disc list-inside text-gray-700">
            <li>Барьцаа буцаах хугацаа болон нөхцөл</li>
            <li>Шинэ үнийг мэдэгдэх хугацаа</li>
            <li>Засварын үүрэг хэнд байх талаар</li>
            <li>Устгах мэдэгдэл, алба</li>
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Тодруулах асуултууд (Байрны эзэнд)</h3>
          <ol className="space-y-3 list-decimal list-inside text-gray-700">
            <li>Барьцаанаас суутгах зардлыг ямар баримтаар нотлох вэ?</li>
            <li>Шинэ үнийг хэд хоногийн өмнө мэдэгдэх вэ?</li>
            <li>Үнийн өөрчлөлтийг хаана бичиж баталгаажуулах вэ?</li>
            <li>Ердийн элэгдлийг хэрхэн бүртгэх вэ?</li>
            <li>Барьцааг ямар дансанд буцаах вэ?</li>
          </ol>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Хуульчийн тэмдэглэл</h3>
          <p className="text-gray-600 mb-4">Хуульч дараах нэмэлт тэмдэглэл хийсэн:</p>
          <p className="text-gray-700 bg-gray-50 p-4 rounded-lg italic">
            "Түрээсийн гэрээний 3.2 заалт (ашиглалтын зардал) дэлгэрэнгүй бичигдээгүй. Түрээслэгчээс гүйцэтгэлийн мэдээлэл авах механизмийг тусгайлан зааж бичих зүйл."
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Нэмэлт асуух</h3>
          <p className="text-gray-600 mb-4">Хуульчаас 1 удаа нэмэлт асуулт асуух боломжтой.</p>
          <div className="flex gap-3">
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              rows={3}
              placeholder="Асуултаа энд бичнэ үү..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-cobalt-500"
              maxLength={1000}
            />
            <button
              onClick={sendQuestion}
              disabled={sending || !newQuestion.trim()}
              className="bg-cobalt-500 text-white py-3 px-6 rounded-lg font-semibold touch-target hover:bg-blue-600 disabled:opacity-50 self-end"
            >
              {sending ? "Илгээж байна..." : "Асуулт илгээх"}
            </button>
          </div>

          {questions.length > 0 && (
            <div className="mt-6 space-y-4">
              <h4 className="font-medium text-gray-900">Асуултын түүх:</h4>
              {questions.map((q) => (
                <div key={q.id} className={`p-4 rounded-lg ${q.from === "citizen" ? "bg-blue-50" : "bg-green-50"}`}>
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <span className="font-medium text-gray-900">{q.from === "citizen" ? "Та" : "Хуульч"}</span>
                    <span className="text-gray-500">{formatDate(q.at)}</span>
                  </div>
                  <p className="text-gray-700">{q.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/me"
          className="inline-flex items-center gap-2 text-cobalt-500 font-medium hover:underline"
        >
          ← Миний гэрээнүүд рүү буцах
        </Link>
      </div>
    </main>
  );
}