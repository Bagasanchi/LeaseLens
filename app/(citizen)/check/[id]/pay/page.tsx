"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Package = "standard" | "urgent";

export default function CheckPayPage() {
  const params = useParams();
  const id = (params.id as string) || "";
  const [packageType, setPackageType] = useState<Package>("standard");
  const [qrCode, setQrCode] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [timer, setTimer] = useState(15 * 60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paid, setPaid] = useState(false);

  const packages = {
    standard: { name: "Стандарт", price: 15000, time: "4 цаг", desc: "Ажлын 4 цагт хуульч хянаж батална" },
    urgent: { name: "Яаралтай", price: 25000, time: "1 цаг", desc: "1 цагт хуульч хянаж батална" },
  };

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const res = await fetch(`/api/checks/${id}/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ package: packageType }),
        });
        if (!res.ok) throw new Error("Төлбөрийн мэдээлэл авахад алдаа гарлаа");
        const data = await res.json();
        setQrCode(data.qrCode);
        setInvoiceId(data.invoiceId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Алдаа гарлаа");
      }
    };
    fetchPayment();
  }, [id, packageType]);

  useEffect(() => {
    if (timer > 0 && !paid) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
    if (timer === 0 && !paid) {
      setError("Төлбөрийн хугацаа дууссан. Дахин мэдээжсэн QR код авахыг оролдоно уу.");
    }
  }, [timer, paid]);

  const checkPaymentStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/qpay/callback?invoice_id=${invoiceId}`);
      if (!res.ok) throw new Error("Төлбөрийг шалгахад алдаа гарлаа");
      const data = await res.json();
      if (data.paid) {
        setPaid(true);
        setTimeout(() => {
          window.location.href = `/check/${id}`;
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Шалгахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const minutes = Math.floor(timer / 60).toString().padStart(2, "0");
  const seconds = (timer % 60).toString().padStart(2, "0");

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <header className="max-w-2xl mx-auto mb-6 flex items-center justify-between">
        <Link href={`/check/${id}`} className="flex items-center gap-3">
          <div className="w-8 h-10 bg-cobalt-500 clip-polygon" />
          <span className="text-2xl font-bold tracking-tight text-gray-900">Гэрээ шалгагч</span>
        </Link>
      </header>

      <div className="max-w-2xl mx-auto">
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif font-medium text-2xl text-gray-900">Төлбөр төлөх</h2>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-cobalt-100 text-cobalt-700">ID: {id.slice(0, 8)}</span>
          </div>

          <div className="grid gap-4 mb-6">
            {Object.entries(packages).map(([key, pkg]) => (
              <button
                key={key}
                onClick={() => setPackageType(key as Package)}
                className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                  packageType === key
                    ? "border-cobalt-500 bg-cobalt-50"
                    : "border-gray-200 hover:border-cobalt-300"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{pkg.name}</span>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{pkg.time}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{pkg.desc}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xl text-gray-900">{pkg.price.toLocaleString()} ₮</div>
                  <div className="text-xs text-gray-500">Нэг удаагийн төлбөр</div>
                </div>
              </button>
            ))}
          </div>

          {!paid && qrCode && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">QPay QR код</span>
                  <span className={`text-lg font-mono tabular-nums ${timer < 60 ? "text-red-600" : "text-gray-900"}`}>
                    {minutes}:{seconds}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-3">15 минутын дотор төлбөр төлнө үү. QR кодыг банкны апп-аар уншина уу.</p>
                <div className="flex justify-center">
                  <img src={qrCode} alt="QPay QR код" className="w-48 h-48" />
                </div>
              </div>

              <button
                onClick={checkPaymentStatus}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold touch-target hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Шалгаж байна..." : "Төлбөр төлсөн эсэхийг шалгах"}
              </button>

              <button
                onClick={() => window.location.reload()}
                className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold touch-target hover:bg-gray-50"
              >
                Шинэ QR код авах
              </button>
            </div>
          )}

          {paid && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-xl text-gray-900 mb-2">Төлбөр амжилттай төлөгдлөө!</h3>
              <p className="text-gray-600 mb-4">AI шинжилгээ эхэллээ. Хуульч хяналтын дарааллд орно.</p>
              <Link
                href={`/check/${id}`}
                className="inline-flex items-center gap-2 bg-cobalt-500 text-white py-3 px-6 rounded-lg font-semibold touch-target hover:bg-blue-600"
              >
                Төлөв харах →
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-600">
          <p className="font-medium mb-2">Мэдээлэл:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>И-баримт (QPay) ашиглан төлбөр төлнө.</li>
            <li>QR код 15 минутын хүчинтэй байна.</li>
            <li>Төлбөр баталгаажсанаас хойш AI шинжилгээ эхэлнэ.</li>
            <li>Хуульч SLA хугацаандаа аваагүй бол өөр хуульчид шилжигдэнэ.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}