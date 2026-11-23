"use client";

import { useEffect, useState } from "react";

interface QPayInvoiceProps {
  invoiceId: string;
  amount: number;
  qrCode?: string;
  expiresAt: string;
  onCheckPayment: () => void;
  onRefresh: () => void;
  checking?: boolean;
  paid?: boolean;
}

export default function QPayInvoice({
  invoiceId,
  amount,
  qrCode,
  expiresAt,
  onCheckPayment,
  onRefresh,
  checking = false,
  paid = false,
}: QPayInvoiceProps) {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const remaining = new Date(expiresAt).getTime() - Date.now();
      setTimer(Math.max(0, remaining));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(timer / 60000).toString().padStart(2, "0");
  const seconds = Math.floor((timer % 60000) / 1000).toString().padStart(2, "0");
  const expired = timer <= 0;

  if (paid) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-semibold text-xl text-gray-900 mb-2">Төлбөр амжилттай төлөгдлөө!</h3>
        <p className="text-gray-600 mb-4">AI шинжилгээ эхэллээ. Хуульч хяналтын дарааллд орно.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-900">QPay QR код</span>
          <span className={`text-lg font-mono tabular-nums ${expired ? "text-red-600" : "text-gray-900"}`}>
            {minutes}:{seconds}
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          15 минутын дотор төлбөр төлнө үү. QR кодыг банкны апп-аар уншина уу.
        </p>
        <div className="flex justify-center">
          {qrCode ? (
            <img src={qrCode} alt="QPay QR код" className="w-48 h-48" />
          ) : (
            <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center text-gray-400">
              QR код ачааллаж байна...
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onCheckPayment}
        disabled={checking}
        className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold touch-target hover:bg-green-700 disabled:opacity-50"
      >
        {checking ? "Шалгаж байна..." : "Төлбөр төлсөн эсэхийг шалгах"}
      </button>

      <button
        onClick={onRefresh}
        className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold touch-target hover:bg-gray-50"
      >
        Шинэ QR код авах
      </button>

      {expired && (
        <div className="text-center text-red-600 text-sm p-3 bg-red-50 rounded-lg">
          Төлбөрийн хугацаа дууссан. Дахин мэдээжсэн QR код авахыг оролдоно уу.
        </div>
      )}
    </div>
  );
}