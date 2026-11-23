"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

const steps = [
  { key: "paid", label: "Төлсөн" },
  { key: "ai_ready", label: "AI бэлтгэсэн" },
  { key: "in_review", label: "Хуульч хянаж буй" },
  { key: "delivered", label: "Бэлэн" },
];

export default function CheckStatusPage() {
  const params = useParams();
  const id = params.id as string;
  const [status, setStatus] = useState<"paid" | "ai_ready" | "in_review" | "delivered">("paid");
  const [lawyerName, setLawyerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/checks/${id}`);
        if (!res.ok) throw new Error("Төлөв авахад алдаа гарлаа");
        const data = await res.json();
        setStatus(data.status);
        setLawyerName(data.lawyerName || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const currentStepIndex = steps.findIndex((s) => s.key === status);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cobalt-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Төлөв ачааллаж байна...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <header className="max-w-2xl mx-auto mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-10 bg-cobalt-500 clip-polygon" />
          <span className="text-2xl font-bold tracking-tight text-gray-900">Гэрээ шалгагч</span>
        </Link>
      </header>

      <div className="max-w-2xl mx-auto">
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif font-medium text-2xl text-gray-900">Шалгалтын төлөв</h2>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-cobalt-100 text-cobalt-700">ID: {id.slice(0, 8)}</span>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 top-8 h-2 bg-gray-200 w-full -translate-x-1/2" />
            <div className="absolute left-1/2 top-8 h-2 bg-cobalt-500 -translate-x-1/2" style={{ width: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%` }} />

            <div className="relative flex justify-between">
              {steps.map((step, i) => (
                <div key={step.key} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold transition-all ${
                      i < currentStepIndex
                        ? "bg-cobalt-500 text-white"
                        : i === currentStepIndex
                        ? "bg-cobalt-500 text-white ring-4 ring-cobalt-100"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {i < currentStepIndex ? (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className={`mt-2 text-sm font-medium text-center ${i <= currentStepIndex ? "text-gray-900" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {lawyerName && status === "in_review" && (
            <div className="mt-6 p-4 bg-cobalt-50 rounded-xl border border-cobalt-200">
              <p className="text-sm text-cobalt-700">
                <span className="font-medium">Хуульч:</span> {lawyerName} хянаж байна
              </p>
            </div>
          )}

          {status === "delivered" && (
            <div className="mt-6 text-center">
              <Link
                href={`/check/${id}/report`}
                className="inline-flex items-center gap-2 bg-cobalt-500 text-white py-3 px-6 rounded-lg font-semibold text-base touch-target hover:bg-blue-600 transition-colors"
              >
                Тайланг харах →
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">SMS мэдэгдэл</h3>
          <p className="text-gray-600 text-sm mb-4">Төлөв өөрчлөгдөх бүрт SMS мэдэгдэл ирнэ.</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 text-cobalt-500 border-gray-300 rounded focus:ring-cobalt-500" defaultChecked />
            <span className="text-sm text-gray-700">SMS мэдэгдэл хүлээн авах</span>
          </label>
        </div>
      </div>
    </main>
  );
}