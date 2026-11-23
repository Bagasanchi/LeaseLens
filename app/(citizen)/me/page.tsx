"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Check = {
  id: string;
  type: "rental" | "labor";
  status: string;
  package: "standard" | "urgent";
  createdAt: string;
  paidAt?: string;
  deliveredAt?: string;
  lawyerName?: string;
};

type Payment = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
};

export default function MyContractsPage() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"checks" | "payments" | "account">("checks");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [checksRes, paymentsRes] = await Promise.all([
          fetch("/api/checks"),
          fetch("/api/payments"),
        ]);
        if (checksRes.ok) setChecks(await checksRes.json());
        if (paymentsRes.ok) setPayments(await paymentsRes.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const deleteCheck = async (id: string) => {
    if (!confirm("Энэ гэрээний түүхийг устгах уу? Энэ үйлдэл нь цуцлагдахгүй.")) return;
    try {
      const res = await fetch(`/api/checks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Устгахад алдаа гарлаа");
      setChecks(checks.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  };

  const deleteAccount = async () => {
    if (!confirm("Бүртгэлийг устгах уу? Бүх мэдээлэл (гэрээ, тайлан, төлбөрийн түүх) устгагдана. Энэ үйлдэл цуцлагдахгүй.")) return;
    if (prompt("Баталгаажуулах үг: DELETE гэж бичнэ үү") !== "DELETE") return;
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) throw new Error("Бүртгэл устгахад алдаа гарлаа");
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: "Нүүрсний", color: "bg-gray-100 text-gray-700" },
    awaiting_payment: { label: "Төлбөр хүлээж байна", color: "bg-yellow-100 text-yellow-800" },
    ai_processing: { label: "AI бэлтгэж байна", color: "bg-blue-100 text-blue-800" },
    in_review: { label: "Хуульч хянаж байна", color: "bg-cobalt-100 text-cobalt-800" },
    delivered: { label: "Бэлэн", color: "bg-green-100 text-green-800" },
    refunded: { label: "Төлбөр буцаагдсан", color: "bg-red-100 text-red-800" },
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("mn-MN", {
      year: "numeric",
      month: "short",
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
          <p className="text-gray-600">Ачааллаж байна...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <header className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-10 bg-cobalt-500 clip-polygon" />
          <span className="text-2xl font-bold tracking-tight text-gray-900">Гэрээ шалгагч</span>
        </Link>
      </header>

      <div className="max-w-4xl mx-auto">
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <nav className="flex" aria-label="Таб сонголт">
            <button
              onClick={() => setActiveTab("checks")}
              className={`flex-1 py-4 px-6 text-center font-medium border-b-2 transition-colors ${
                activeTab === "checks" ? "border-cobalt-500 text-cobalt-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Миний гэрээнүүд
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`flex-1 py-4 px-6 text-center font-medium border-b-2 transition-colors ${
                activeTab === "payments" ? "border-cobalt-500 text-cobalt-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Төлбөрийн түүх
            </button>
            <button
              onClick={() => setActiveTab("account")}
              className={`flex-1 py-4 px-6 text-center font-medium border-b-2 transition-colors ${
                activeTab === "account" ? "border-cobalt-500 text-cobalt-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Бүртгэл
            </button>
          </nav>
        </div>

        {activeTab === "checks" && (
          <div className="bg-white rounded-xl border border-gray-200">
            {checks.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="font-semibold text-gray-900 mb-1">Гэрээ байхгүй байна</h3>
                <p className="text-gray-500 mb-4">Эхний гэрээгээ шалгаж эхлэх үү?</p>
                <Link
                  href="/check/new"
                  className="inline-flex items-center gap-2 bg-cobalt-500 text-white py-3 px-6 rounded-lg font-semibold touch-target hover:bg-blue-600"
                >
                  Гэрээ шалгах →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {checks.map((check) => {
                  const statusInfo = statusLabels[check.status] || { label: check.status, color: "bg-gray-100 text-gray-700" };
                  return (
                    <Link
                      key={check.id}
                      href={`/check/${check.id}`}
                      className="block p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                              {check.type === "rental" ? "Түрээс" : "Хөдөлмөр"}
                            </span>
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                              {check.package === "standard" ? "Стандарт" : "Яаралтай"}
                            </span>
                          </div>
                          <p className="font-medium text-gray-900 truncate mb-1">
                            Шалгалт #{check.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Үүсгэгдсэн: {formatDate(check.createdAt)}
                            {check.paidAt && <span className="mx-2">•</span>}
                            {check.paidAt && <span>Төлсөн: {formatDate(check.paidAt)}</span>}
                            {check.deliveredAt && <span className="mx-2">•</span>}
                            {check.deliveredAt && <span>Бэлэн: {formatDate(check.deliveredAt)}</span>}
                            {check.lawyerName && <span className="mx-2">•</span>}
                            {check.lawyerName && <span className="text-cobalt-600">Хуульч: {check.lawyerName}</span>}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteCheck(check.id);
                          }}
                          className="text-red-500 hover:text-red-700 p-2 flex-shrink-0"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="bg-white rounded-xl border border-gray-200">
            {payments.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-semibold text-gray-900 mb-1">Төлбөрийн түүх алга</h3>
                <p className="text-gray-500">Гэрээ шалгахад төлбөр төлснөөр энд харагдана.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <div key={payment.id} className="p-6 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Төлбөр #{payment.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-500">{formatDate(payment.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">{payment.amount.toLocaleString()} ₮</p>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        payment.status === "paid" ? "bg-green-100 text-green-800" :
                        payment.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {payment.status === "paid" ? "Төлсөн" : payment.status === "pending" ? "Хүлээж байна" : "Амжилтгүй"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "account" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Бүртгэлийн мэдээлэл</h3>
              <p className="text-gray-600">Таны утасны дугаар, нэвтрэлтийн мэдээлэл энд хадгалагдана.</p>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-lg text-gray-900 mb-4 text-red-600">Бүртгэл устгах</h3>
              <p className="text-gray-600 mb-4">
                Бүртгэлийг устгахдаа дараах мэдээлэл бүрэн устгагдана:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 mb-4">
                <li>Бүх гэрээ шалгалтын түүх ба тайлангууд</li>
                <li>Төлбөрийн түүх ба и-баримтууд</li>
                <li>Хадгалсан зөвшөөрлүүд</li>
              </ul>
              <p className="text-red-600 text-sm mb-4 font-medium">Энэ үйлдэл нь цуцлагдахгүй!</p>
              <button
                onClick={deleteAccount}
                className="bg-red-600 text-white py-3 px-6 rounded-lg font-semibold touch-target hover:bg-red-700"
              >
                Бүртгэл устгах
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}