"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 12)}`;
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.replace(/\D/g, "") }),
      });
      if (!res.ok) throw new Error("OTP илгээхэд алдаа гарлаа");
      setStep("otp");
      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer((t) => {
          if (t <= 1) {
            clearInterval(interval);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.replace(/\D/g, ""), otp }),
      });
      if (!res.ok) throw new Error("Код буруу эсвэл хугацаа дууссан");
      router.push("/check/new");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Нэвтрэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.replace(/\D/g, "") }),
      });
      if (!res.ok) throw new Error("Дахин илгээхэд алдаа гарлаа");
      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer((t) => {
          if (t <= 1) {
            clearInterval(interval);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-8 h-10 bg-cobalt-500 clip-polygon" />
            <span className="text-2xl font-bold tracking-tight text-gray-900">Гэрээ шалгагч</span>
          </Link>
          <h1 className="font-serif font-medium text-3xl text-gray-900">Нэвтрэх</h1>
          <p className="text-gray-600 mt-2">Утасны дугаараараа нэвтрэнэ үү</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {step === "phone" ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
              <div>
                <label htmlFor="phone" className="block font-medium text-gray-700 mb-2">
                  Утасны дугаар
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formatPhone(phone)}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="99 123456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-cobalt-500 text-lg"
                  maxLength={14}
                  required
                  autoComplete="tel"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">Монгол улсын утасны дугаар (8 орон)</p>
              </div>
              <button
                type="submit"
                disabled={loading || phone.replace(/\D/g, "").length < 8}
                className="w-full bg-cobalt-500 text-white py-3 px-6 rounded-lg font-semibold text-base touch-target hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Илгээж байна..." : "OTP код илгээх"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}
              <div>
                <label className="block font-medium text-gray-700 mb-2">6 оронтой код</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-cobalt-500 text-2xl tracking-widest text-center"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-cobalt-500 text-white py-3 px-6 rounded-lg font-semibold text-base touch-target hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Шалгаж байна..." : "Нэвтрэх"}
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendTimer > 0 || loading}
                className="w-full text-cobalt-500 font-medium text-sm hover:underline disabled:opacity-50"
              >
                {resendTimer > 0 ? `Дахин илгээх (${resendTimer}s)` : "Код ирээгүй үү? Дахин илгээх"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}