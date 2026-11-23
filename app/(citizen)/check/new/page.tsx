"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type CheckStep = "type" | "upload" | "consent";

export default function CheckNewPage() {
  const router = useRouter();
  const [step, setStep] = useState<CheckStep>("type");
  const [type, setType] = useState<"rental" | "labor">("rental");
  const [files, setFiles] = useState<File[]>([]);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const consentFlags = {
    ai: false,
    lawyer: false,
    transfer: false,
  };
  const [consent, setConsent] = useState(consentFlags);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length + files.length > 20) {
      setError("Хамгийн ихдээ 20 файл оруулах боломжтой");
      return;
    }
    const totalSize = [...files, ...newFiles].reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 20 * 1024 * 1024) {
      setError("Нийт файл хэмжээ 20MB-ээс их байж болохгүй");
      return;
    }
    setFiles([...files, ...newFiles]);
    setError("");
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const reorderFiles = (fromIndex: number, toIndex: number) => {
    const newFiles = [...files];
    const [removed] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, removed);
    setFiles(newFiles);
  };

  const handleTypeSubmit = () => {
    setStep("upload");
    setError("");
  };

  const handleUploadSubmit = async () => {
    if (files.length === 0) {
      setError("Хамгийн багадаа 1 файл оруулна уу");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("type", type);
      files.forEach((f) => formData.append("files", f));
      if (question) formData.append("question", question);

      const res = await fetch("/api/checks", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Гэрээ илгээхэд алдаа гарлаа");
      const data = await res.json();
      router.push(`/check/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleConsentSubmit = async () => {
    if (!consent.ai || !consent.lawyer || !consent.transfer) {
      setError("Бүх зөвшөөрлийг чагтлана уу");
      return;
    }
    // Consent is handled in the upload step via API
    router.push("/check/new"); // This would redirect to payment step
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {["Төрөл", "Файл", "Зөвшөөрөл"].map((label, i) => (
        <React.Fragment key={label}>
          <div
            className={`flex items-center gap-2 ${
              (step === "type" && i === 0) ||
              (step === "upload" && i === 1) ||
              (step === "consent" && i === 2)
                ? "text-cobalt-500"
                : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                (step === "type" && i === 0) ||
                (step === "upload" && i === 1) ||
                (step === "consent" && i === 2)
                  ? "bg-cobalt-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              {i + 1}
            </div>
            <span className="hidden sm:block font-medium">{label}</span>
          </div>
          {i < 2 && (
            <div
              className={`w-16 h-0.5 mx-2 ${
                (step === "upload" && i === 0) || (step === "consent" && i <= 1)
                  ? "bg-cobalt-500"
                  : "bg-gray-200"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <header className="max-w-2xl mx-auto mb-6 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <div className="w-8 h-10 bg-cobalt-500 clip-polygon" />
          <span className="text-2xl font-bold tracking-tight text-gray-900">Гэрээ шалгагч</span>
        </a>
      </header>

      <div className="max-w-2xl mx-auto">
        {renderStepIndicator()}

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

          {step === "type" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif font-medium text-2xl text-gray-900 mb-2">Гэрээний төрөл сонгох</h2>
                <p className="text-gray-600">Шалгах гэрээний төрлийг сонгоно уу</p>
              </div>
              <div className="grid gap-4">
                {[
                  { value: "rental", label: "Түрээсийн гэрээ", desc: "Барьцаа, түрээс, засвар, устгах нөхцөл" },
                  { value: "labor", label: "Хөдөлмөрийн гэрээ", desc: "Цалин, цаг, илүү цог, эрүүл мэнд, устгах" },
                ].map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setType(value as "rental" | "labor")}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      type === value
                        ? "border-cobalt-500 bg-cobalt-50"
                        : "border-gray-200 hover:border-cobalt-300"
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{label}</div>
                    <div className="text-sm text-gray-500 mt-1">{desc}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={handleTypeSubmit}
                className="w-full bg-cobalt-500 text-white py-3 px-6 rounded-lg font-semibold text-base touch-target hover:bg-blue-600 transition-colors"
              >
                Дараачийн алхам →
              </button>
            </div>
          )}

          {step === "upload" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif font-medium text-2xl text-gray-900 mb-2">Гэрээгээ оруулах</h2>
                <p className="text-gray-600">Зураг (JPG/PNG) эсвэл PDF файл хуулж оруулна уу. 20 хуудас, 20MB хүртэл.</p>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <input
                  type="file"
                  id="file-upload"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={loading}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-gray-600">Файл сонгох эсвэл эндلүүлнэ үү</span>
                  <span className="text-xs text-gray-400">JPG, PNG, PDF · 20 файлаас доош · 20MB хүртэл</span>
                </label>
              </div>

              {files.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Оруулсан файлууд (хуудас дараалал):</h3>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                        disabled={loading}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => index > 0 && reorderFiles(index, index - 1)}
                          disabled={index === 0 || loading}
                          className="p-1 text-gray-500 hover:text-cobalt-500 disabled:opacity-30"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        </button>
                        <span className="text-sm text-gray-500 w-6 text-center">{index + 1}</span>
                        <button
                          onClick={() => index < files.length - 1 && reorderFiles(index, index + 1)}
                          disabled={index === files.length - 1 || loading}
                          className="p-1 text-gray-500 hover:text-cobalt-500 disabled:opacity-30"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V5" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label htmlFor="question" className="block font-medium text-gray-700 mb-2">
                  Асуудал бичих (сонголттой)
                </label>
                <textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                  placeholder="Жишээ: Барьцааг хэрхэн буцааж авах вэ? Түрээс нэмэгдүүлэх нь зөвшөөрөгддөг үү?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 focus:border-cobalt-500"
                  maxLength={500}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("type")}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold touch-target hover:bg-gray-50"
                >
                  ← Буцах
                </button>
                <button
                  onClick={handleUploadSubmit}
                  disabled={loading}
                  className="flex-1 bg-cobalt-500 text-white py-3 px-6 rounded-lg font-semibold touch-target hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? "Илгээж байна..." : "Зөвшөөрөлд шилжүүлэх →"}
                </button>
              </div>
            </div>
          )}

          {step === "consent" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-serif font-medium text-2xl text-gray-900 mb-2">Зөвшөөрөл</h2>
                <p className="text-gray-600">Доорх 3 нөхцөл бүрийг ойлгож, зөвшөөрнө үү</p>
              </div>

              {[
                {
                  key: "ai",
                  title: "AI үйлчилгээ",
                  desc: "Таны гэрээний текстийг далдлаж (регистр, утас, данс устгах), Claude AI-р шинжилж эрсдэл, тайлбар, асуулт бэлтгэнэ. Энэ нь анхан шатны тойм юм.",
                },
                {
                  key: "lawyer",
                  title: "Хуульч хянаж батална",
                  description: "AI-ийн дүгнэлт бүрийг мэргэжлийн хуульч зөвшөөрөх / засах / хасах эсвэл шинэ дүгнэлт нэмэхээр хянаж, баталж иргэнд хүргэнэ.",
                },
                {
                  key: "transfer",
                  title: "Гадаадад дамжуулах",
                  desc: "Далдлагдсан текст зөвхөн Anthropic (Claude API) руу явах бөгөөд, өгөгдлийн эх файлууд Монгол дахь серверт хадгалагдана. 24 цагийн дараа эх файл устгагдана.",
                },
              ].map(({ key, title, desc }) => (
                <label
                  key={key}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    consent[key as keyof typeof consent]
                      ? "border-cobalt-500 bg-cobalt-50"
                      : "border-gray-200 hover:border-cobalt-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={consent[key as keyof typeof consent]}
                    onChange={() => setConsent({ ...consent, [key]: !consent[key as keyof typeof consent] })}
                    className="w-5 h-5 text-cobalt-500 border-gray-300 rounded focus:ring-cobalt-500 mt-0.5"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{title}</div>
                    <div className="text-sm text-gray-600 mt-1">{desc}</div>
                  </div>
                </label>
              ))}

              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p className="font-medium mb-1">24 цагийн устгал:</p>
                <p>Таны эх файлууд (зураг/PDF) төлбөр төлснөөс хойш 24 цагийн дараа автоматаар устгагдана. Далдлагдсан текст ба тайлан иргэн устгах хүртэл хадгалагдана.</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("upload")}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold touch-target hover:bg-gray-50"
                >
                  ← Буцах
                </button>
                <button
                  onClick={handleConsentSubmit}
                  className="flex-1 bg-cobalt-500 text-white py-3 px-6 rounded-lg font-semibold touch-target hover:bg-blue-600"
                >
                  Төлбөрт шилжүүлэх →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}