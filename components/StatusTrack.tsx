"use client";

type Status =
  | "awaiting_payment"
  | "ai_processing"
  | "ai_ready"
  | "in_review"
  | "delivered"
  | "refunded";

const STEPS: Array<{ key: Status; label: string; icon: string }> = [
  { key: "awaiting_payment", label: "Төлбөр", icon: "💳" },
  { key: "ai_processing", label: "AI шинжилгээ", icon: "🤖" },
  { key: "in_review", label: "Хуульч хяналт", icon: "⚖️" },
  { key: "delivered", label: "Бэлэн", icon: "✅" },
];

const ORDER: Status[] = ["awaiting_payment", "ai_processing", "in_review", "delivered"];

interface StatusTrackProps {
  current: Status;
  package?: "standard" | "urgent";
  lawyerName?: string;
  showSmsOptIn?: boolean;
  onSmsChange?: (checked: boolean) => void;
  smsChecked?: boolean;
}

export default function StatusTrack({
  current,
  package: pkg,
  lawyerName,
  showSmsOptIn = false,
  onSmsChange,
  smsChecked = false,
}: StatusTrackProps) {
  const currentIndex = ORDER.indexOf(current);
  const completed = currentIndex >= 0 ? currentIndex + 1 : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">Шалгалтын төлөв</h3>
        <span className="px-2 py-0.5 text-xs font-medium rounded bg-cobalt-100 text-cobalt-700">
          {pkg === "urgent" ? "Яаралтай (1 цаг)" : "Стандарт (4 цаг)"}
        </span>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-3 w-full h-1 bg-gray-200" />
        <div className="absolute left-0 top-3 w-full h-1 bg-cobalt-500" style={{ width: `${(completed / ORDER.length) * 100}%` }} />

        <div className="relative flex justify-between">
          {ORDER.map((step, i) => {
            const isCompleted = i < completed;
            const isCurrent = i === currentIndex;
            const stepData = STEPS.find((s) => s.key === step)!;

            return (
              <div key={step} className="relative flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-all ${
                    isCompleted
                      ? "bg-cobalt-500 text-white"
                      : isCurrent
                      ? "bg-cobalt-100 text-cobalt-600 ring-4 ring-cobalt-100"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isCompleted ? "✓" : stepData.icon}
                </div>
                <span className={`mt-2 text-xs text-center w-24 ${
                  isCompleted || isCurrent ? "font-semibold text-gray-900" : "text-gray-500"
                }`}>
                  {stepData.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {current === "in_review" && lawyerName && (
        <div className="bg-cobalt-50 border border-cobalt-200 rounded-lg p-3">
          <p className="text-sm text-cobalt-800">
            <span className="font-medium">Хуульч:</span> {lawyerName}
          </p>
        </div>
      )}

      {showSmsOptIn && (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <input
            type="checkbox"
            id="sms-opt-in"
            checked={smsChecked}
            onChange={(e) => onSmsChange?.(e.target.checked)}
            className="w-5 h-5 text-cobalt-500 border-gray-300 rounded focus:ring-2 focus:ring-cobalt-500"
          />
          <label htmlFor="sms-opt-in" className="text-sm text-green-800 cursor-pointer">
            СМС мэдэгдэл авах (Шалгалт бэлтгэгдэхэд, хуульч авч хэлэхэд, баталж илгээнэ)
          </label>
        </div>
      )}
    </div>
  );
}