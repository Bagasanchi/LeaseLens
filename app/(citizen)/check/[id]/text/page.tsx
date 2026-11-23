"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import MaskedTextViewer from "@/components/MaskedTextViewer";

export default function CheckTextPage() {
  const params = useParams();
  const id = params.id as string;
  const [textData, setTextData] = useState<{
    maskedText: string;
    masks: Array<{ type: string; original: string; masked: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    const fetchText = async () => {
      try {
        const res = await fetch(`/api/checks/${id}/text`);
        if (!res.ok) throw new Error("Текст авахад алдаа гарлаа");
        const data = await res.json();
        setTextData({ maskedText: data.maskedText, masks: data.masks });
        setEditedText(data.maskedText);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Алдаа гарлаа");
      } finally {
        setLoading(false);
      }
    };
    fetchText();
  }, [id]);

  const handleSave = async () => {
    if (!editedText.trim()) {
      setError("Текст хоосон байж болохгүй");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/checks/${id}/text`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maskedText: editedText }),
      });
      if (!res.ok) throw new Error("Хадгалахад алдаа гарлаа");
      const data = await res.json();
      setTextData({ maskedText: data.maskedText, masks: data.masks });
      setEditedText(data.maskedText);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cobalt-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Текст ачааллаж байна...</p>
        </div>
      </main>
    );
  }

  if (!textData) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600">Текст олдсонгүй</p>
        </div>
      </main>
    );
  }

  const displayText = showOriginal && textData.masks.length > 0
    ? textData.masks.reduce(
        (acc, m) => acc.replace(new RegExp(m.masked.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), m.original),
        textData.maskedText
      )
    : textData.maskedText;

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <header className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <Link href={`/check/${id}`} className="flex items-center gap-3">
          <div className="w-8 h-10 bg-cobalt-500 clip-polygon" />
          <span className="text-2xl font-bold tracking-tight text-gray-900">Гэрээ шалгагч</span>
        </Link>
      </header>

      <div className="max-w-4xl mx-auto">
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-900">Гэрээний текст</h2>
              <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                showOriginal ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
              }`}>
                {showOriginal ? "Эх текст (Нууц мэдээлэл ил)" : "Далдлагдсан (PII далд)"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {textData.masks.length > 0 && (
                <button
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                >
                  {showOriginal ? "Далдлах" : "Эх текст харах"}
                </button>
              )}
            </div>
          </div>

          {!editing ? (
            <div>
              <div className="bg-gray-50 rounded-lg p-4 max-h-[60vh] overflow-auto border border-gray-200 mb-4">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 font-mono">
                  {displayText}
                </pre>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Нийт далдлагдсан хэсэг: {textData.masks.length}
                </div>
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-cobalt-500 text-white rounded-lg font-medium touch-target hover:bg-blue-600"
                >
                  Засах
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                <strong>Анхааруулга:</strong> Энэхүү текст далдлагдсан хувилбар юм. Өөрчлөлт хийхэд далдлагдсан мэдээлэл (регистр, утас, данс, г.м) сэргээгдэхгүй.
              </p>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={20}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cobalt-500 font-mono text-sm"
                placeholder="Гэрээний текстийг энд засна уу..."
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setEditedText(textData.maskedText);
                    setEditing(false);
                    setError("");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium touch-target hover:bg-gray-50"
                >
                  Болих
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-cobalt-500 text-white rounded-lg font-medium touch-target hover:bg-blue-600 disabled:opacity-50"
                >
                  {saving ? "Хадгалаж байна..." : "Хадгалах"}
                </button>
              </div>
            </div>
          )}
        </div>

        <Link
          href={`/check/${id}`}
          className="inline-flex items-center gap-2 text-cobalt-500 font-medium hover:underline"
        >
          ← Шалгалтын дэлгэц рүү буцах
        </Link>
      </div>
    </main>
  );
}