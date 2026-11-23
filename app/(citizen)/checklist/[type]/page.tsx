"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

const checklists: Record<"rental" | "labor", Array<{ id: string; title: string; items: string[] }>> = {
  rental: [
    {
      id: "contract-basics",
      title: "Гэрээний негіз заалтууд",
      items: [
        "Түрээс өгөгч, түрээсгүйний овог, нэр, регистрийн дугаар, хаяг",
        "Орон сууцын хаяг, тоот, өрөөний тоо, талбай",
        "Гэрээний хугацаа (эхлэх, дуусах огноо)",
        "Түрээсийн үнэ, төлбөрийн хугацаа, данс",
        "Барьцаа (хэмжээ, буцаах нөхцөл, хугацаа)",
        "Түрээсийн үнийг шинэчлэх механизм",
        "Ашиглалтын зардлын хариуцлага (цахилгаан, ус, халх хаалга)",
        "Засвар арилгахын үүрэг (жижих, том засвар)",
        "Гэрээг урьдчилан дүгнэх нөхцөл, мэдэгдлийн хугацаа",
        "Гэрээний хугацаа дуусахад орхиноос гаргах зардал",
      ],
    },
    {
      id: "rights-duties",
      title: "Эрх үүрэг",
      items: [
        "Түрээсгүйний эрх (ашиглах, суух, зөвшөөрөлгүй үйлчлэхгүй)",
        "Түрээс өгөгчийн эрх (үнийг шинэчлэх, барьцаа авах, шалгах)",
        "Ашиглалтын зардлын тодруулгыг шаардлах эрх",
        "Засвар арилгах хүсэлт илгээх эрх",
        "Нууцлалын эрх (түрээс өгөгч урьдчилан мэдэгдэлгүй орж ирэхгүй)",
      ],
    },
    {
      id: "legal",
      title: "Хууль зүйн шаардлага",
      items: [
        "ГЭЗ 25.1 - Түрээсийн үнийг шинэчлэх мэдэгдлийн хугацаа",
        "ХЗБ 33.1 - Түрээсийн үнийн тогтоомт",
        "Өрхийн нөөцийн хууль - Түрээсийн гэрээний бүртгэл",
        "Хуучин гэрээ цуцлах мэдэгдлийн хугацаа",
        "Хетоевчээр тусгаарлан заасан заалтууд (питомник, цуглалтын суудал, г.м)",
      ],
    },
  ],
  labor: [
    {
      id: "contract-basics",
      title: "Гэрээний негіз заалтууд",
      items: [
        "Ажил олгогч, ажилтны овог, нэр, регистрийн дугаар, хаяг",
        "Ажлын байр, албан тушаал, мэргэжил",
        "Ажлын хугацаа (тогтмол/хугацаагаар, эхлэх огноо)",
        "Цалин (хэмжээ, төлөх хугацаа, данс)",
        "Ажлын цаг, амгалан, өдөр тутмын амралт",
        "Ажлын хүчин чадал, эрүүл мэндийн үзлэг",
        "Амгалан авах эрх, үеийн цалин",
        "Эрүүл мэндийн даа хамгаалалт",
        "Гэрээг урьдчилан дүгнэх нөхцөл",
        "Нөхцөл зөрчих хариуцлага",
      ],
    },
    {
      id: "rights-duties",
      title: "Эрх үүрэг",
      items: [
        "Ажилтны эрх (цалин авч, амгалан авах, аюулгүй ажлын орчин)",
        "Ажил олгогчийн эрх (ажлын үр дүнг шаардах, шалгах, заах)",
        "Хөдөлмөр бусдын холбоо, гишүүнлэл",
        "Ажлын уурилга, заавар зарлиг дагах",
        "Нууцлал хамгаалах",
      ],
    },
    {
      id: "legal",
      title: "Хууль зүйн шаардлага",
      items: [
        "ХМЛ 140.1 - Ажлын цагийн норма (өдөрт 8 цаг)",
        "ХМЛ 111.2 - Цалин тоглох хугацаа",
        "ЭМ 142.2 - Амгалан авах хугацаа (жилийн 14 хоног)",
        "ХМЛ 88.1 - Аюулгүй, эрүүл ажлын орчин",
        "ХМЛ 100.1 - Өдөр тутмын амралтын цагийн хэмжээ",
      ],
    },
  ],
};

export default function ChecklistPage() {
  const params = useParams();
  const type = (params.type as "rental" | "labor") || "rental";

  const data = checklists[type];

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <header className="max-w-3xl mx-auto mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-10 bg-cobalt-500 clip-polygon" />
          <span className="text-2xl font-bold tracking-tight text-gray-900">Гэрээ шалгагч</span>
        </Link>
      </header>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              type === "rental" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
            }`}>
              {type === "rental" ? "Түрээсийн гэрээ" : "Хөдөлмөрийн гэрээ"}
            </span>
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">Чадварлаг гэрээ бичихийн зөвлөмж</span>
          </div>
          <h2 className="font-serif font-medium text-2xl text-gray-900 mb-2">Чадварлаг гэрээ бичих зөвлөмж</h2>
          <p className="text-gray-600">
            Дээрх заалтуудыг таны гэрээнд бүгд нэмэгдсэн эсэхийг шалгана уу. Энэ нь AI шинжилгээний нэмэлт дүрмийн нэг.
          </p>
        </div>

        <div className="space-y-6">
          {data.map((section) => (
            <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-lg text-gray-900">{section.title}</h3>
              </div>
              <ul className="divide-y divide-gray-100">
                {section.items.map((item, i) => (
                  <li key={i} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      className="w-5 h-5 mt-0.5 text-cobalt-500 border-gray-300 rounded focus:ring-2 focus:ring-cobalt-500"
                    />
                    <label className="text-gray-700 cursor-pointer flex-1">{item}</label>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="bg-cobalt-50 border border-cobalt-200 rounded-xl p-6 text-center">
            <h3 className="font-semibold text-cobalt-800 mb-2">AI шинжилгээ хэрэгтэй юу?</h3>
            <p className="text-cobalt-600 mb-4">
              Давхардлагагүй гэрээ бичихын тулд AI тойм + хуульчийн баталгаа авахыг санал болгож байна.
            </p>
            <Link
              href="/check/new"
              className="inline-flex items-center gap-2 bg-cobalt-500 text-white py-3 px-6 rounded-lg font-semibold touch-target hover:bg-blue-600"
            >
              AI шинжилгээ эхлүүлэх →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}