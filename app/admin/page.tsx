"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type QueuedCheck = {
  id: string;
  type: "rental" | "labor";
  package: "standard" | "urgent";
  slaDueAt: string;
  createdAt: string;
  pages: number;
  lawyerId?: string;
};

type Lawyer = {
  id: string;
  name: string;
  licenseNumber: string;
  verified: boolean;
  activeChecks: number;
  totalEarnings: number;
  avgRating: number;
};

type AdminMetrics = {
  queueLoad: { waiting: number; inProgress: number; overdue: number };
  slaBreaches: { total: number; last24h: number; byLawyer: Record<string, number> };
  verification: { pending: number; verified: number; rejected: number };
  library: { laws: number; articles: number; lastUpdated: string };
  pricing: { standard: number; urgent: number };
  aiEditRate: { total: number; edited: number; rate: number };
};

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"queue" | "lawyers" | "laws" | "pricing" | "metrics">("queue");
  const [queue, setQueue] = useState<QueuedCheck[]>([]);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [queueRes, lawyersRes, metricsRes] = await Promise.all([
          fetch("/api/admin/queue"),
          fetch("/api/admin/lawyers"),
          fetch("/api/admin/metrics"),
        ]);
        if (queueRes.ok) setQueue(await queueRes.json());
        if (lawyersRes.ok) setLawyers(await lawyersRes.json());
        if (metricsRes.ok) setMetrics(await metricsRes.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getTimeRemaining = (dueAt: string) => {
    const due = new Date(dueAt).getTime();
    const now = Date.now();
    const diff = due - now;
    if (diff <= 0) return { expired: true, text: "SLA дууссан" };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { expired: false, text: `${hours}ц ${minutes}м` };
  };

  const isBusinessHours = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    if (day === 0) return false;
    if (day === 6) return hour >= 10 && hour < 18;
    return hour >= 9 && hour < 21;
  };

  const reassignCheck = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/checks/${id}/reassign`, { method: "POST" });
      if (!res.ok) throw new Error("Шилжүүлэхэд алдаа гарлаа");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  };

  const verifyLawyer = async (id: string, action: "verify" | "reject") => {
    try {
      const res = await fetch(`/api/admin/lawyers/${id}/${action}`, { method: "POST" });
      if (!res.ok) throw new Error(action === "verify" ? "Баталгаажуулахад алдаа гарлаа" : "Буцаахад алдаа гарлаа");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  };

  const updatePricing = async (standard: number, urgent: number) => {
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ standard, urgent }),
      });
      if (!res.ok) throw new Error("Үнийг шинэчлэхэд алдаа гарлаа");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cobalt-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Админ дэлгэц ачааллаж байна...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <header className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <Link href="/lawyer" className="flex items-center gap-3">
          <div className="w-8 h-10 bg-cobalt-500 clip-polygon" />
          <span className="text-2xl font-bold tracking-tight text-gray-900">Админ дэлгэц</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${isBusinessHours() ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
            {isBusinessHours() ? "Ажлын цаг" : "Ажлын цагт биш"}
          </span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        {error && <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        <nav className="flex gap-1 mb-8 bg-white rounded-xl border border-gray-200 p-1" aria-label="Админ табууд">
          {[
            { id: "queue", label: "Дарааллын удирдлага" },
            { id: "lawyers", label: "Хуульчид" },
            { id: "laws", label: "Хууль сан" },
            { id: "pricing", label: "Үнэлгээ" },
            { id: "metrics", label: "Метрик" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-cobalt-500 text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === "queue" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Queue Overview Cards */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg text-gray-900">Дарааллын төлөв</h2>
                  <span className="px-2 py-1 text-xs bg-cobalt-100 text-cobalt-700 rounded-full">{queue.length} гэрээ</span>
                </div>
                {queue.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p>Дарааллын гэрээ алга</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[700px] overflow-auto">
                    {queue.map((check) => {
                      const timeRemain = getTimeRemaining(check.slaDueAt);
                      return (
                        <div
                          key={check.id}
                          className={`p-4 rounded-xl border transition-all ${
                            timeRemain.expired ? "border-red-300 bg-red-50" : check.lawyerId ? "border-blue-200 bg-blue-50" : "border-gray-200 hover:border-cobalt-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${check.package === "urgent" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>
                                  {check.package === "urgent" ? "Яаралтай" : "Стандарт"}
                                </span>
                                <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                                  {check.type === "rental" ? "Түрээс" : "Хөдөлмөр"}
                                </span>
                                <span className="text-xs text-gray-500">{check.pages} хуудас</span>
                                {check.lawyerId && (
                                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800">Авагдсан</span>
                                )}
                              </div>
                              <p className="font-mono text-sm text-gray-500">ID: {check.id.slice(0, 8)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`text-sm font-medium ${timeRemain.expired ? "text-red-600" : "text-gray-900"}`}>
                                SLA: {timeRemain.text}
                              </span>
                              {!check.lawyerId && !timeRemain.expired && (
                                <button
                                  onClick={() => reassignCheck(check.id)}
                                  className="px-3 py-1.5 bg-cobalt-500 text-white rounded font-medium text-xs touch-target hover:bg-blue-600"
                                >
                                  Дахин тараах
                                </button>
                              )}
                              {timeRemain.expired && (
                                <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded font-medium text-xs">SLA дууссан</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SLA Breaches */}
              {metrics && metrics.slaBreaches.total > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-lg text-gray-900 mb-4">SLA эвдлэлүүд</h3>
                  <div className="grid sm:grid-cols-3 gap-4 mb-4">
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-700 mb-1">Нийт эвдэлэл</p>
                      <p className="font-bold text-2xl text-red-800">{metrics.slaBreaches.total}</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-700 mb-1">Сүүлийн 24 цаг</p>
                      <p className="font-bold text-2xl text-orange-800">{metrics.slaBreaches.last24h}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700 mb-1">Хуульч бүр</p>
                      <p className="font-bold text-2xl text-gray-800">
                        {Object.values(metrics.slaBreaches.byLawyer).reduce((a, b) => a + b, 0)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(metrics.slaBreaches.byLawyer).map(([lawyerId, count]) => (
                      <div key={lawyerId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-900">{lawyers.find(l => l.id === lawyerId)?.name || lawyerId}</span>
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-sm font-medium">{count} эвдэлэл</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Metrics Sidebar */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Дарааллын статистик</h3>
                <div className="space-y-4">
                  {metrics && [
                    { label: "Хүлээж байна", value: metrics.queueLoad.waiting, color: "cobalt" },
                    { label: "Хянаж байна", value: metrics.queueLoad.inProgress, color: "blue" },
                    { label: "SLA дууссан", value: metrics.queueLoad.overdue, color: "red" },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">{stat.label}</span>
                      <span className={`font-bold text-xl text-${stat.color}-600`}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">AI засварлах хамтарол</h3>
                {metrics && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Нийт дүгнэлт</span>
                      <span className="font-bold text-xl text-gray-900">{metrics.aiEditRate.total}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-sm text-blue-700">Хуульч зассан</span>
                      <span className="font-bold text-xl text-blue-800">{metrics.aiEditRate.edited}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-cobalt-50 rounded-lg border border-cobalt-200">
                      <span className="text-sm text-cobalt-700">Хамтарлын хувь</span>
                      <span className="font-bold text-xl text-cobalt-800">{metrics.aiEditRate.rate.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cobalt-500 rounded-full transition-all"
                        style={{ width: `${metrics.aiEditRate.rate}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "lawyers" && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-lg text-gray-900">Хуульчийн бүртгэл ба баталгаажуулалт</h2>
              {metrics && (
                <div className="flex gap-4 text-sm">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Баталгаажагдсан: {metrics.verification.verified}</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Хүлээж байна: {metrics.verification.pending}</span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded">Буцаагдсан: {metrics.verification.rejected}</span>
                </div>
              )}
            </div>
            <div className="divide-y divide-gray-200">
              {lawyers.map((lawyer) => (
                <div key={lawyer.id} className="p-6 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-gray-900">{lawyer.name}</span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                        № {lawyer.licenseNumber}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        lawyer.verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {lawyer.verified ? "Баталгаажагдсан" : "Хүлээж байна"}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800">
                        Идэвхтэй: {lawyer.activeChecks}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Нийт орлого: <span className="font-medium text-gray-900">{lawyer.totalEarnings.toLocaleString()} ₮</span></span>
                      <span>Дүн: <span className="font-medium text-gray-900">{lawyer.avgRating.toFixed(1)}</span></span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!lawyer.verified && (
                      <>
                        <button
                          onClick={() => verifyLawyer(lawyer.id, "verify")}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium touch-target hover:bg-green-700"
                        >
                          Баталгаажуулах
                        </button>
                        <button
                          onClick={() => verifyLawyer(lawyer.id, "reject")}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium touch-target hover:bg-red-50"
                        >
                          Буцаах
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {lawyers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>Хуульч бүртгэлгүй байна</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "laws" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-lg text-gray-900">Хууль сангийн удирдлага</h2>
              <button className="px-4 py-2 bg-cobalt-500 text-white rounded-lg font-medium touch-target hover:bg-blue-600">
                + Хууль/иш нэмэх
              </button>
            </div>
            {metrics && (
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-cobalt-50 rounded-lg border border-cobalt-200">
                  <p className="text-sm text-cobalt-700 mb-1">Хуулууд</p>
                  <p className="font-bold text-2xl text-cobalt-800">{metrics.library.laws}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 mb-1">Ишууд</p>
                  <p className="font-bold text-2xl text-blue-800">{metrics.library.articles}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700 mb-1">Сүүлийн шинэчлэлт</p>
                  <p className="font-bold text-xl text-gray-800">{metrics.library.lastUpdated}</p>
                </div>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-600">
              <p>Хууль сангийн дэлгэрэнгүй удирдлага (CRUD) нь API-рүү дараагийн хувилбараар нэмэгдэнэ.</p>
            </div>
          </div>
        )}

        {activeTab === "pricing" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
            <h2 className="font-semibold text-lg text-gray-900 mb-6">Үнэлгээний тохиргоо</h2>
            {metrics && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  updatePricing(
                    parseInt(formData.get("standard") as string),
                    parseInt(formData.get("urgent") as string)
                  );
                }}
                className="space-y-6"
              >
                <div>
                  <label htmlFor="standard" className="block text-sm font-medium text-gray-700 mb-2">
                    Стандарт (4 цаг)
                  </label>
                  <input
                    type="number"
                    id="standard"
                    name="standard"
                    defaultValue={metrics.pricing.standard}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500"
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <label htmlFor="urgent" className="block text-sm font-medium text-gray-700 mb-2">
                    Яаралтай (1 цаг)
                  </label>
                  <input
                    type="number"
                    id="urgent"
                    name="urgent"
                    defaultValue={metrics.pricing.urgent}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500"
                    min="0"
                    step="1000"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-cobalt-500 text-white py-3 px-6 rounded-lg font-semibold touch-target hover:bg-blue-600">
                    Үнийг шинэчлэх
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === "metrics" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">SLA метрикүүд</h3>
              {metrics && (
                <div className="space-y-4">
                  {[
                    { label: "Дарааллын уур амьсгал (газар бүр)", value: "Нэмэх шаардлагатай", color: "gray" },
                    { label: "Хуульч бүрт гэрээ тоо", value: `${lawyers.reduce((a, b) => a + b.activeChecks, 0)} / ${lawyers.length}`, color: "blue" },
                    { label: "SLA эвдэлэлийн хувь", value: queue.length > 0 ? `${((metrics.queueLoad.overdue / queue.length) * 100).toFixed(1)}%` : "0%", color: "red" },
                    { label: "Дундаж хяналтын хугацаа", value: "Нэмэх шаардлагатай", color: "gray" },
                  ].map((metric) => (
                    <div key={metric.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">{metric.label}</span>
                      <span className={`font-bold text-xl text-${metric.color}-600`}>{metric.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">AI & Хуульчийн хамтарол</h3>
              {metrics && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">AI дүгнэлт бүрт засварлах хувь</span>
                    <span className="font-bold text-xl text-cobalt-600">{metrics.aiEditRate.rate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Зөвшөөрөгдсөн дүгнэлт</span>
                    <span className="font-bold text-xl text-green-600">{metrics.aiEditRate.total - metrics.aiEditRate.edited}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Зассан дүгнэлт</span>
                    <span className="font-bold text-xl text-blue-600">{metrics.aiEditRate.edited}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Хассан дүгнэлт</span>
                    <span className="font-bold text-xl text-red-600">Нэмэх шаардлагатай</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cobalt-500 rounded-full transition-all"
                      style={{ width: `${metrics.aiEditRate.rate}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">AI тойм хэвээрээ зөвшөөрөгдөх хувь</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}