interface VerifiedSealProps {
  lawyerName?: string;
  licenseNumber?: string;
  verifiedAt?: string;
  size?: "sm" | "md" | "lg";
}

export default function VerifiedSeal({
  lawyerName,
  licenseNumber,
  verifiedAt,
  size = "md",
}: VerifiedSealProps) {
  const containerPadding = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div className={`bg-cobalt-50 border border-cobalt-200 rounded-xl ${containerPadding[size]} relative overflow-hidden`}>
      {/* Background Seal Watermark */}
      <div className="absolute -right-4 -bottom-4 text-cobalt-100 opacity-50 pointer-events-none">
        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
        </svg>
      </div>

      <div className="relative z-10 flex items-start gap-4">
        <div className="w-12 h-12 bg-cobalt-500 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-md">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cobalt-100 text-cobalt-800 text-xs font-semibold mb-1">
            <span>Хуульч хянаж баталгаажуулсан</span>
          </div>

          <h4 className="font-bold text-gray-900 text-base mb-1 truncate">
            {lawyerName || "Сертификаттай хуульч"}
          </h4>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
            {licenseNumber && (
              <span>Үнэмлэх №: <span className="font-mono font-medium text-gray-800">{licenseNumber}</span></span>
            )}
            {verifiedAt && (
              <span>Баталгаажуулсан: <span className="font-medium text-gray-800">{new Date(verifiedAt).toLocaleDateString("mn-MN")}</span></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}