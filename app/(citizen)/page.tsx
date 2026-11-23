"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const [showContent, setShowContent] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  useEffect(() => {
    const fragment = new URLSearchParams(location.hash.slice(1));
    if (fragment.has("access_token") || fragment.has("error_description") || new URLSearchParams(location.search).has("code")) {
      location.replace("/checker/index.html" + location.search + location.hash);
      return;
    }
    const confirmed = localStorage.getItem("ageConfirmed");
    if (confirmed === "true") {
      setAgeConfirmed(true);
      setShowContent(true);
    }
  }, []);

  const handleEnter = () => {
    localStorage.setItem("ageConfirmed", "true");
    setAgeConfirmed(true);
    setShowContent(true);
  };

  if (!ageConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">18 ба түүнээс дээш насныханд</h2>
          <p className="text-gray-600 mb-6">
            «Гэрээ шалгагч» нь 18 нас хүрсэн түрээслэгчдэд зориулагдсан. Хуудсыг дахин ачаалахад насаа дахин баталгаажуулна.
          </p>
          <button
            onClick={handleEnter}
            className="w-full bg-cobalt-500 text-white py-3 px-6 rounded-lg font-semibold text-base touch-target hover:bg-blue-600 transition-colors"
          >
            Би 18 нас хүрсэн
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-10 bg-cobalt-500 clip-polygon" />
            <span className="text-2xl font-bold tracking-tight text-gray-900">Гэрээ шалгагч</span>
          </div>
          <Link
            href="/checklist/rental"
            className="hidden md:block text-sm text-gray-600 hover:text-cobalt-500"
          >
            Үнэгүй шалгах жагсаалт
          </Link>
        </nav>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-cobalt-500 bg-cobalt-50 rounded-full mb-4">
              Иргэний үйлчилгээ
            </span>
            <h1 className="font-serif font-medium text-5xl lg:text-7xl leading-[0.99] text-gray-900 mb-6">
              Гэрээгээ<br />
              <em className="text-cobalt-600 font-normal">бичгээр баталгаажуул.</em>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mb-8">
              Байрны эзэнтэй тохирсон нөхцөл гэрээнд хэрхэн туссан байгааг шалгаж, барьцаагаа төлөхөөс өмнө эрсдлийг олоорой.
            </p>
            <Link
              href="/check/new"
              className="inline-flex items-center gap-2 bg-cobalt-500 text-white py-4 px-8 rounded-lg font-semibold text-base touch-target hover:bg-blue-600 transition-colors"
            >
              Гэрээ шалгах →
            </Link>
          </div>

          <div className="relative hidden lg:block" aria-hidden="true">
            <div className="aspect-square max-w-md mx-auto relative">
              <div className="absolute inset-0 bg-green-100 rounded-2xl opacity-50" />
              <div className="absolute left-1/4 top-24 w-1/2 h-[200px] bg-yellow-50 border border-green-200 rounded-xl shadow-lg p-6 rotate-[-9deg] font-serif italic text-xl text-green-800">
                Түрээсийн гэрээ
              </div>
              <div className="absolute right-8 bottom-20 bg-yellow-100 text-yellow-900 px-5 py-3 rounded-lg shadow-md rotate-6 font-serif italic text-lg">
                Халаалт багтсан уу?
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-200">
        <h2 className="font-serif font-medium text-3xl text-gray-900 mb-8 text-center">Хэрхэн ажиллана вэ</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: "1", title: "Гэрээ оруулах", desc: "Зураг эсвэл PDF-оор гэрээгээ хуулах" },
            { step: "2", title: "AI шинжилгээ", desc: "Эрсдэлийг тодорхойлж, заалт тайлбарлана" },
            { step: "3", title: "Хуульч батална", desc: "Мэргэжлийн хуульч дүгнэлтүүдийг хянаж баталлаа" },
            { step: "4", title: "Тайлан авах", desc: "«Хуульч хянаж баталсан» тэмдэгтэй PDF" },
          ].map(({ step, title, desc }) => (
            <div key={step} className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-12 h-12 bg-cobalt-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="font-serif font-medium text-3xl text-gray-900 mb-8 text-center">Гэрээний төрөл</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <Link
            href="/checklist/rental"
            className="bg-white rounded-xl border border-gray-200 p-6 hover:border-cobalt-500 hover:shadow-md transition-all"
          >
            <h3 className="font-semibold text-lg text-gray-900 mb-2">Түрээсийн гэрээ</h3>
            <p className="text-gray-600 text-sm mb-4">Барьцаа, түрээс, засвар, устгах нөхцөл, хамгаалалтыг шалгана.</p>
            <span className="text-cobalt-500 font-medium text-sm">Жагсаалтыг харах →</span>
          </Link>
          <Link
            href="/checklist/labor"
            className="bg-white rounded-xl border border-gray-200 p-6 hover:border-cobalt-500 hover:shadow-md transition-all"
          >
            <h3 className="font-semibold text-lg text-gray-900 mb-2">Хөдөлмөрийн гэрээ</h3>
            <p className="text-gray-600 text-sm mb-4">Цалин, цаг, илүү цог, эрүүл мэнд, устгах алхмыг шалгана.</p>
            <span className="text-cobalt-500 font-medium text-sm">Жагсаалтыг харах →</span>
          </Link>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-gray-500">
          Гэрээ шалгагч v2 · AI тойм + Хуульчийн баталгаа · Ажлын 4 цагт
        </div>
      </footer>
    </main>
  );
}