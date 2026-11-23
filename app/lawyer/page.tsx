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
};

export default function LawyerQueuePage() {
  const [queue, setQueue] = useState<QueuedCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [earningsToday, setEarningsToday] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch("/api/lawyer/queue");
        if (!res.ok) throw new Error("Дараалал авахад алдаа гарлаа");
        const data = await res.json();
        setQueue(data.queue || []);
        setEarningsToday(data.earningsToday || 0);
        setActiveCount(data.activeCount || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const claimCheck = async (id: string) => {
    try {
      const res = await fetch(`/api/lawyer/checks/${id}/claim`, { method: "POST" });
      if (!res.ok) throw new Error("Гэрээ авахад алдаа гарлаа");
      window.location.href = `/lawyer/review/${id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
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

  const isBusinessHours = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const hour = now.getHours();
    if (day === 0) return false; // Sunday
    if (day === 6) return hour >= 10 && hour < 18; // Saturday 10-18
    return hour >= 9 && hour < 21; // Mon-Fri 9-21
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cobalt-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Дараалал ачааллаж байна...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <header className="max-w-7xl mx-auto mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-10 bg-cobalt-500 clip-polygon" />
          <span className="text-2xl font-bold tracking-tight text-gray-900">Гэрээ шалгагч</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${isBusinessHours() ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
            {isBusinessHours() ? "Ажлын цаг" : "Ажлын цагт биш"}
          </div>
          <span className="text-sm text-gray-500">Өнөөдрийн орлого: {earningsToday.toLocaleString()} ₮</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-gray-900">Хүлээж буй гэрээнүүд</h2>
              <span className="px-2 py-1 text-xs bg-cobalt-100 text-cobalt-700 rounded-full">{queue.length} гэрээ</span>
            </div>
            {queue.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>Хүлээж буй гэрээ алга</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-auto">
                {queue.map((check) => {
                  const timeRemain = getTimeRemaining(check.slaDueAt);
                  return (
                    <div key={check.id} className={`p-4 rounded-xl border transition-all ${timeRemain.expired ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-cobalt-300"}`}>
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
                          </div>
                          <p className="font-mono text-sm text-gray-500">ID: {check.id.slice(0, 8)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-sm font-medium ${timeRemain.expired ? "text-red-600" : "text-gray-900"}`}>
                            {timeRemain.text}
                          </span>
                          <button
                            onClick={() => claimCheck(check.id)}
                            disabled={timeRemain.expired}
                            className="px-4 py-2 bg-cobalt-500 text-white rounded-lg font-medium text-sm touch-target hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Авах
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Хуульчийн дэлгэц</h3>
            <div className="space-y-4">
              <div className="p-4 bg-cobalt-50 rounded-lg border border-cobalt-200">
                <p className="text-sm text-cobalt-700 mb-1">SLA тоолуур</p>
                <p className="font-bold text-2xl text-cobalt-800">{queue.filter((c) => !getTimeRemaining(c.slaDueAt).expired).length} / {queue.length}</p>
                <p className="text-xs text-cobalt-600 mt-1">Цагын дотор баталгаажуулах</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 mb-1">Өнөөдрийн орлого</p>
                <p className="font-bold text-2xl text-green-800">{earningsToday.toLocaleString()} ₮</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 mb-1">Идэвхтэй гэрээнүүд</p>
                <p className="font-bold text-2xl text-blue-800">{activeCount}</p>
              </div>
              <div className="pt-4 border-t border-gray-200 space-y-2 text-sm text-gray-600">
                <p>Стандарт: 4 цаг (Ажлын цаг)</p>
                <p>Яаралтай: 1 цаг (Ажлын цаг)</p>
                <p className="text-cobalt-600 font-medium">Ажлын цаг: Д-Л 9:00-21:00, Бя 10:00-18:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}