"use client";

import { useState } from "react";
import { MaskResult, unmaskText } from "@/lib/mask";

interface MaskedTextViewerProps {
  maskedText: string;
  masks?: MaskResult["masks"];
  allowToggleOriginal?: boolean;
}

export default function MaskedTextViewer({
  maskedText,
  masks = [],
  allowToggleOriginal = true,
}: MaskedTextViewerProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  const displayText = showOriginal && masks.length > 0
    ? unmaskText(maskedText, masks)
    : maskedText;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Гэрээний текст</h3>
          <span className={`px-2 py-0.5 text-xs rounded font-medium ${
            showOriginal ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
          }`}>
            {showOriginal ? "Эх текст (Нууц мэдээлэл ил)" : "Далдлагдсан (PII далд)"}
          </span>
        </div>

        {allowToggleOriginal && masks.length > 0 && (
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
          >
            {showOriginal ? "Далдлах" : "Эх текст харах"}
          </button>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 max-h-[500px] overflow-auto border border-gray-200">
        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 font-mono">
          {displayText}
        </pre>
      </div>

      <div className="text-xs text-gray-500 flex items-center justify-between pt-2 border-t border-gray-100">
        <span>Нийт далдлагдсан хэсэг: {masks.length}</span>
        <span>Хувь хүний нууцын тухай хуулийн дагуу далдлагдсан</span>
      </div>
    </div>
  );
}