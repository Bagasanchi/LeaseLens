/**
 * In-memory demo data store.
 * Replace with Supabase queries in production (see supabase/migrations).
 * Seeded with realistic Mongolian rental/labor contract data.
 */

import { maskPII, MaskResult } from "./mask";
import { calculateOverallRisk, RiskLevel } from "./risk";

export type ContractType = "rental" | "labor";
export type PackageType = "standard" | "urgent";
export type CheckStatus =
  | "draft"
  | "awaiting_payment"
  | "ai_processing"
  | "ai_ready"
  | "in_review"
  | "delivered"
  | "refunded";

export interface Check {
  id: string;
  userId: string;
  type: ContractType;
  package: PackageType;
  status: CheckStatus;
  createdAt: string;
  paidAt?: string;
  deliveredAt?: string;
  slaDueAt?: string;
  lawyerId?: string;
  lawyerName?: string;
  lawyerNote?: string;
  overallRisk: RiskLevel;
  pages: number;
  amount: number;
}

export interface Finding {
  id: string;
  checkId: string;
  clauseQuote: string;
  risk: RiskLevel;
  explanation: string;
  lawArticleId: string;
  suggestion: string;
  source: "ai" | "lawyer";
  status: "pending" | "approved" | "edited" | "rejected";
  lawyerNote?: string;
  createdAt: string;
}

export interface CheckText {
  checkId: string;
  originalText: string;
  maskedText: string;
  masks: MaskResult["masks"];
  createdAt: string;
}

export interface Consent {
  id: string;
  checkId: string;
  kind: "ai_processing" | "lawyer_review" | "data_retention" | "sms_notifications";
  granted: boolean;
  at: string;
}

export interface Payment {
  id: string;
  checkId: string;
  userId: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "refunded";
  invoiceId: string;
  qrCode: string;
  package: PackageType;
  createdAt: string;
  paidAt?: string;
  expiresAt: string;
}

export interface Lawyer {
  id: string;
  name: string;
  email: string;
  licenseNumber: string;
  verified: boolean;
  status: "active" | "suspended";
  activeChecks: number;
  totalEarnings: number;
  avgRating: number;
  createdAt: string;
}

export interface Question {
  id: string;
  checkId: string;
  from: "citizen" | "lawyer";
  body: string;
  at: string;
}

export interface LawArticle {
  id: string;
  code: string;
  title: string;
  body: string;
  category: ContractType | "general";
  updatedAt: string;
}

export interface AuditEntry {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  at: string;
}

export interface Pricing {
  standard: number;
  urgent: number;
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const SAMPLE_RENTAL_CONTRACT = `ТҮРЭЭСЛЭГЧИЙН ГЭРЭЭ

Түрээсийн гэрээгч (цаашид "Түрээсгүй") байршлуулагч (цаашид "Түрээс өгөгч") болох бөгөөд энэ гэрээг 2026 оны 11 дүгээр сарын 20-нд Улаанбаатар хот, Сүхбаатар дүүргийн 1-р хорооллын 15 тоотой оршин суух 2 өрөөтэй оройн цацрагт 65 м² орон сууц түрээслэх эрхтэй болгон нэгэнтэй зөвшөөрнө.

1. ТҮРЭЭСНИЙ ҮНЭ
1.1. Түрээсийн сарын үнэ 450,000 (дөрвөн зуун таван мянган төгрөг) төгрөг байна.
1.2. Түрээсийн үнийг тухайн сарын 1-нд улаанбаатар хотын худалдаа үйлчилгээний газар тогтоосон үнийн индексийн өөрчлөлтийн дагуу 6 сар бүр шинэчилж болно.
1.3. Шинэ үнийг шинэчилсэн бол түрээсгүй өмнөх сарын 20-аас өмнө мэдэгдэх үүдгийг албан бичгээр урьдчилан мэдэгдэх ёстой. Мэдэгдэлгүйгээр шинэчилсэн үнийг буцаан төлөх ёсгүй.
1.4. Бүх төлбөрийг Монгол улсын Төрийн банкны Хан-Уул филиалд, 1234 5678 9012 3456 гэсэн данстай хийнэ.

2. БАРЬЦАА
2.1. Түрээс өгөгч түрээсгүйдээ 450,000 төгрөгийн барьцаа өгнө.
2.2. Барьцааг ашиглалтын зардлын өгүүлбэрт (3.2) бичсэнээр түрээсийн төлбөрийн 2 сарын хэмжээгээр авна.
2.3. Барьцаа буцааж өгөх хугацаа нь гэрээ дуусмагц 7 хоногийн дараа.
2.4. Түрээсгүй ашиглалтын төлбөрийг 3 сар хүрэлцэхгүй болон түрээсийн өдрийн 3 дахь хоногийн дараа гэрээсээ нь гарсан тохиолдолд түрээс өгөгч түрээсийг урьдчилан мэдэгдэлгүйгээр цуцлах эрхтэй.

3. АШИГЛАЛТЫН ЗАРДАЛ
3.1. Цахилгаан, ус, ханиахны төлбөрийг түрээс өгөгч харилцана.
3.2. Ашиглалтын зардлын өгүүлбэр гэж дээр байх бөгөөд ханиахны төлбөрийн тооцооллыг хувийн архив, засвар арилгах үйлчилгээ, ханиахны гэр, агаарын бохиржлын төлбөрийг агуулна.
3.3. Гэрээнд ашиглалтын зардлын тодруулга дутсан бол түрээс өгөгч түрээсийг өдөр тутам цагт 5,000 төгрөгөр бууруулж болно.

4. ГЭРЭЭНИЙ ҮГУЙЛЭГ
4.1. Гэрээ 1 жилийн хугацаанд байх бөгөөд гэрээсээ гарах үед өмнөх түрээсийн сарын төлбөрийг төлөх ёстой.
4.2. Түрээсгүй гэрээг урьдчилан мэдэгдэлгүйгээр 30 хоногоор дүгнэж болно. Хэрэв ийм мэдэгдэл хийвэл түрээс өгөгч өөрийн түрээсгүйгээ түрээсэнд өгдөг болно.
4.3. Гэрээг дүгнэхэд орхиноос нь гаргах зардлыг түрээсгүй төлнө.

5. ХУВЬЦГАЙ ХАРИУЦАГЧ
5.1. Түрээс өгөгч түрээсийн хугацаа дуусахад өдөрт 30,000 төгрөгийн нехцөл зөвхөн мөрдөнө.
5.2. Гэрээний аль ч заалтыг зөрчих тохиолдолд нөхцөл зөрсөн талын 3 өдөгт хариуцлагын тогтоосон хэмжээгээр төлбөрийг төлөх ёстой.

Түрээсийн гэрээг хоёр тал гар дүрсэж, гурван хувилбарт үйлдэж, тус бүр 1 хувийг хадгалсан болно.

ГЭРЭЭГҮЙЛДЭЖҮҮЛЭХ:
Түрээс өгөгч: Б. Дорж
Хууль: Ц. Бат
Регистр: 88019912345
Утас: 976 8899 7766`;

const SAMPLE_LABOR_CONTRACT = `ХОДӨЛМӨР ГЭРЭЭ

1. ХИЙХ АЖИЛ
1.1. Ажилтан улсын хуулийн хүрээн дотор "Сантехник" мэргэжилтэй, нийслэл Улаанбаатар хот, Баянгол дүүргийн 8-р хорооллын 42 тоотой оршин суух 3 өрөөтэй оройн цацрагт 48 м² орон сууц.
1.2. Ажилтан нь өдөрт 8 цаг, 6 хоногийн ажиллах хугацаатай. Өдрийн ажиллалтын цаг 09:00 - 18:00.
1.3. Ажлын хэсэгт очих, гэрээтэй холбогдох ажлын зориулалтыг ажилтныг өмнөх өдөр нь урьдчилан мэдэгдэх ба ажилтныг өөрийн зөвшөөрөлгүйгээр алсан бол өдрийн үнэлгээнд 2 дахин хориотой өдөр гүйцэтгэсний цацрагт тооцно.

2. ЦАЛИН
2.1. Цалин сарын 1,200,000 (нэг сая хоёр зуун мянган төгрөг) төгрөг.
2.2. Цалиныг сарын 10-нд Төрийн банкны дансаар олгоно.
2.3. Ажилтны ажиллах хугацаа 5 жил болох тул хууль зүйнд заасан өдөр тутмын амралтын цагийг авна.
2.4. Цалин өгөх хугацааг өнгөрсөн бол ажилтан өдөр тутмын үнэлгээнд хүчин төгөлдөршсөн эсэхийг эргүүлж шаардах эрхтэй.

3. АМГАЛАН ДАРГАХ
3.1. Ажилтан жилд 14 хоногийн амгалан авна.
3.2. Ажилтан тогтмол амгалан авах боломжгүй бол ажлаа эрхлэх өдрийн өмнөх өдөр мэдэгдэж, амгаланы хугацаагүй хугацаагаар өгнө.

4. ЭРҮҮЛ МЭНДИЙН ҮЗАМЖ
4.1. Ажилтны эрүүл мэндийн үзэмж, ажлын тэгшээр үзлэгчээс ойлсон тэгшээр зөрөгдсөн бол ажлын өдөр цагт 5,000 төгрөгийн хэмжээгээр амралтын цаг тооцно.

5. ХАРИУЦАГЧ
5.1. Ажилтан үйлчилгээний явдалд алдаа хийвэл тэр бүрт хүчинтэй нэхцөл зөрчих үйлдэл болох бөгөөд түүнээс гарах эрсдэл бүхий гэрээнд хариуцлага хүлээнэ.
5.2. Ажилтны нууц мэдээллийг задлахад ажилтан хууль зүйн хариуцлага хүлээнэ.

6. АЖИЛТАН ГЭРЭЭНЕЭС ГАРАХ
6.1. Ажилтан ажлаасаа гарах хүсэлтэй бол ажлын хугацаа дуусахаас өмнөх 30 хоногийн өмнө бичгээр мэдэгдэнэ.
6.2. Ажилтны ажлын хугацаа дуусахад ажлын хугацаанаас илүү хугацаа авах гэж өгөгдөж байгаа бол тэдгээрийг ажлын хугацааны эцэст бүрэн бүрэн төлөнө.

АЖИЛТАН ГЭРЭЭГҮЙЛДЭЖҮҮЛЭХ:
Ажилтны овог, нэр: Д. Болд
Утас: 97612345678
Регистр: 90018877
Ажилтны дугаар: 2

Түрээсийн өмнөх төлбөрийн гүйцэтгэлийг шалгах, хуулийн өөрчлөлтөөс үл хамааран ч гэрээний бичвэрийн заавал биелэх ёстой.`;

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();
const hoursFromNow = (h: number) => new Date(now + h * 3600_000).toISOString();

const seedLawyers: Lawyer[] = [
  {
    id: "law_001",
    name: "Б.Батболд",
    email: "batbold@leaselens.mn",
    licenseNumber: "A-2019-0456",
    verified: true,
    status: "active",
    activeChecks: 2,
    totalEarnings: 1845000,
    avgRating: 4.8,
    createdAt: hoursAgo(24 * 200),
  },
  {
    id: "law_002",
    name: "Д.Азар",
    email: "azar@leaselens.mn",
    licenseNumber: "A-2021-1123",
    verified: true,
    status: "active",
    activeChecks: 1,
    totalEarnings: 920000,
    avgRating: 4.6,
    createdAt: hoursAgo(24 * 150),
  },
  {
    id: "law_003",
    name: "С.Нарнай",
    email: "narnai@leaselens.mn",
    licenseNumber: "A-2023-0789",
    verified: false,
    status: "active",
    activeChecks: 0,
    totalEarnings: 0,
    avgRating: 0,
    createdAt: hoursAgo(24 * 12),
  },
];

const seedLaws: LawArticle[] = [
  {
    id: "law_gez",
    code: "ГЭЗ",
    title: "Гэрээний зүйл",
    body: "Гэрээний зүйл нь иргэн болон хууль ёсны эрх зүйн дүрээр тогтоосон эрх зүйн харилцааг бичгээр илэрхийлсэн байхыг хэлнэ.",
    category: "general",
    updatedAt: hoursAgo(24 * 30),
  },
  {
    id: "law_gez_25",
    code: "ГЭЗ 25.1",
    title: "Түрээсийн үнийг шинэчлэх",
    body: "Түрээсийн үнийг өөрчлөхөд түрээс өгөгч түрээсийн үнийг шинэчилж буй тухай мэдэгдлийг түрээсгүйд өмнөх сарын 20-аас өмнө бичгээр хүргүүлэх ёстой.",
    category: "rental",
    updatedAt: hoursAgo(24 * 30),
  },
  {
    id: "law_hoz_33",
    code: "ХЗБ 33.1",
    title: "Түрээсийн үнийн тогтоомт",
    body: "Түрээсийн үнийг тогтоохдоо байршлын, байгаа ач хөрөнгийн чанарыг харгалзуулж, төлбөрийн хугацааг зөвшөөрөх хүрээнийг тооцно.",
    category: "rental",
    updatedAt: hoursAgo(24 * 45),
  },
  {
    id: "law_hml_140",
    code: "ХМЛ 140.1",
    title: "Ажлын цагийн норма",
    body: "Ажлын өдрийн үргэлжлэх хугацаа өдөрт найман цаг, амралтын цаг өдөрт цагт 45 минут байна.",
    category: "labor",
    updatedAt: hoursAgo(24 * 60),
  },
  {
    id: "law_hml_111",
    code: "ХМЛ 111.2",
    title: "Цалин тоглох хугацаа",
    body: "Ажлын үнэмлэлтэй ажилтны цалин, мөрөн дүүрийг хөдөлмөрийн хугацаа дуусах буюу тогтоосон хугацаанаас өмнө тогтоосон хугацаагаар олгоно.",
    category: "labor",
    updatedAt: hoursAgo(24 * 60),
  },
  {
    id: "law_em_142",
    code: "ЭМ 142.2",
    title: "Амгалан авах хугацаа",
    body: "Ажилтан жилд 14 хоногоос багагүй амгалан авах эрхтэй бөгөөд амгаланы үеийн цалин хөдөлмөрийн дундаж хөдөлмөрийн цалинд нэмэгдэнэ.",
    category: "labor",
    updatedAt: hoursAgo(24 * 60),
  },
];

function buildSeed() {
  const checks: Check[] = [];
  const findings: Finding[] = [];
  const texts: CheckText[] = [];
  const consents: Consent[] = [];
  const payments: Payment[] = [];
  const questions: Question[] = [];

  const rentalMask = maskPII(SAMPLE_RENTAL_CONTRACT);
  const laborMask = maskPII(SAMPLE_LABOR_CONTRACT);

  // Check 1: delivered (rental)
  checks.push({
    id: "chk_delivered_1",
    userId: "usr_demo",
    type: "rental",
    package: "standard",
    status: "delivered",
    createdAt: hoursAgo(72),
    paidAt: hoursAgo(71),
    deliveredAt: hoursAgo(65),
    slaDueAt: hoursAgo(67),
    lawyerId: "law_001",
    lawyerName: "Б.Батболд",
    lawyerNote:
      "Түрээсийн гэрээний 3.2 заалт (ашиглалтын зардал) дэлгэрэнгүй бичигдээгүй. Түрээслэгчээс гүйцэтгэлийн мэдээлэл авах механизмийг тусгайлан зааж бичих зүйл.",
    overallRisk: "high",
    pages: 8,
    amount: 15000,
  });

  texts.push({
    checkId: "chk_delivered_1",
    originalText: SAMPLE_RENTAL_CONTRACT,
    maskedText: rentalMask.maskedText,
    masks: rentalMask.masks,
    createdAt: hoursAgo(71),
  });

  const rentalFindings: Omit<Finding, "checkId" | "createdAt">[] = [
    {
      id: "fnd_r1",
      clauseQuote: "Түрээсийн үнийг шинэчилж болно. Мэдэгдэлгүйгээр шинэчилсэн үнийг буцаан төлөх ёсгүй.",
      risk: "high",
      explanation:
        "1.3 дахь өгүүлбэрт шинэ үнийн мэдэгдлийн хугацаа, хэлбэр зөвхөн өгүүлбэрт тусгаарласан байна. ГЭЗ 25.1-ийн дагуу өмнөх сарын 20-аас өмнө бичгээр мэдэгдэх ёстой.",
      lawArticleId: "ГЭЗ 25.1",
      suggestion:
        "«1.3. Түрээсийн үнийг шинэчилсэн тохиолдолд түрээс өгөгч өмнөх сарын 20-аас өмнө бичгээр мэдэгдэл хийх ёстой. Мэдэгдэлгүй шинэчилсэн үнэ хүчин төгөлдөршөөгүй байна.» гэж тодруулж бичих.",
      source: "ai",
      status: "approved",
    },
    {
      id: "fnd_r2",
      clauseQuote: "Барьцааг ашиглалтын зардлын өгүүлбэрт (3.2) бичсэнээр түрээсийн төлбөрийн 2 сарын хэмжээгээр авна.",
      risk: "high",
      explanation:
        "Барьцаа өгөгдөл нь ашиглалтын зардлын тодорхойгүй өгүүлбэрт холбоогүй бөгөөд иймээс түрээс өгөгчийн эрхэнд үл зөрөх өндөр эрсдэл үүсгэнэ.",
      lawArticleId: "ХЗБ 33.1",
      suggestion:
        "Барьцааны хэмжээг тогтоох механизмыг тодорхой зааж, 3.2 дахь өгүүлбэрийн бодит хэрэглээг тогтоох тогтолцоо хийх.",
      source: "ai",
      status: "edited",
      lawyerNote:
        "Барьцаа өгөгдлийн нөхцөлийг тодруулахын тулд 3.2-ын өгүүлбэрт «ашиглалтын зардлын тодруулгыг хувийн архив, засвар арилгах үйлчилгээ, ханиахны гэр, агаарын бохиржлын төлбөрийг агуулна» гэж тодруулж бичих.",
    },
    {
      id: "fnd_r3",
      clauseQuote: "Түрээс өгөгч түрээсийг урьдчилан мэдэгдэлгүйгээр цуцлах эрхтэй.",
      risk: "mid",
      explanation:
        "Урьдчилан мэдэгдэлгүй цуцлах нь талуудын тэнцэтгэлийг зөрчиж болох тул хуулийн зүйлд нийцэх эсэхийг нягтлах шаардлагатай.",
      lawArticleId: "ГЭЗ",
      suggestion:
        "«Түрээсгүй төлбөрийн өдрийн 3 дахь хоногийн дараа түрээсээ гарсан тохиолдолд түрээс өгөгч урьдчилан 7 хоногийн мэдэгдэл өгөөд түрээсийг цуцлаж болно.» гэж тэнцэтгэлийг хангах ёстой.",
      source: "ai",
      status: "approved",
    },
    {
      id: "fnd_r4",
      clauseQuote: "Гэрээг дүгнэхэд орхиноос нь гаргах зардлыг түрээсгүй төлнө.",
      risk: "low",
      explanation:
        "Орхиноос нь гаргах зардлыг хууль ёсны дагуу түрээсгүй төлдөг бөгөөд нэмэлт тодруулалт шаардлагатай.",
      lawArticleId: "ГЭЗ",
      suggestion: "Орхиноос нь гаргах зардлын тооцооллыг гэрээнд тодруулах.",
      source: "ai",
      status: "rejected",
    },
  ];

  rentalFindings.forEach((f, i) => {
    findings.push({ ...f, checkId: "chk_delivered_1", createdAt: hoursAgo(70 - i) });
  });

  consents.push(
    { id: "con_1", checkId: "chk_delivered_1", kind: "ai_processing", granted: true, at: hoursAgo(71) },
    { id: "con_2", checkId: "chk_delivered_1", kind: "lawyer_review", granted: true, at: hoursAgo(71) },
    { id: "con_3", checkId: "chk_delivered_1", kind: "data_retention", granted: true, at: hoursAgo(71) },
    { id: "con_4", checkId: "chk_delivered_1", kind: "sms_notifications", granted: true, at: hoursAgo(71) }
  );

  payments.push({
    id: "pay_1",
    checkId: "chk_delivered_1",
    userId: "usr_demo",
    amount: 15000,
    status: "paid",
    invoiceId: "INV-DEMO-0001",
    qrCode: "",
    package: "standard",
    createdAt: hoursAgo(71),
    paidAt: hoursAgo(71),
    expiresAt: hoursAgo(70.75),
  });

  questions.push({
    id: "q_1",
    checkId: "chk_delivered_1",
    from: "citizen",
    body: "Барьцааны мөнгөөр хүрэхцээ хэрэвтэй юу?",
    at: hoursAgo(64),
  });

  // Check 2: in review (rental, urgent)
  checks.push({
    id: "chk_inreview_1",
    userId: "usr_demo",
    type: "rental",
    package: "urgent",
    status: "in_review",
    createdAt: hoursAgo(3),
    paidAt: hoursAgo(2.8),
    slaDueAt: hoursFromNow(0.8),
    lawyerId: "law_001",
    lawyerName: "Б.Батболд",
    overallRisk: "mid",
    pages: 6,
    amount: 25000,
  });

  texts.push({
    checkId: "chk_inreview_1",
    originalText: SAMPLE_RENTAL_CONTRACT,
    maskedText: rentalMask.maskedText,
    masks: rentalMask.masks,
    createdAt: hoursAgo(2.8),
  });

  const inReviewFindings: Omit<Finding, "checkId" | "createdAt">[] = [
    {
      id: "fnd_i1",
      clauseQuote: "Цахилгаан, ус, ханиахны төлбөрийг түрээс өгөгч харилцана.",
      risk: "low",
      explanation: "Энэ нь зөвхөн гурван төрлийн зардлыг заасан бөгөөд бусад зардлын хариуцлагын илэрхий зүйл алга.",
      lawArticleId: "ХЗБ 33.1",
      suggestion: "Ашиглалтын бүх зардлыг онцгон тодруулах эсвэл «бусад зардлыг түрээс өгөгч хариулна» гэж ерөнхий заавал тавих.",
      source: "ai",
      status: "pending",
    },
    {
      id: "fnd_i2",
      clauseQuote: "Ашиглалтын зардлын өгүүлбэр гэж дээр байх бөгөөд ханиахны төлбөрийн тооцооллыг хувийн архив, засвар арилгах үйлчилгээ, ханиахны гэр, агаарын бохиржлын төлбөрийг агуулна.",
      risk: "mid",
      explanation:
        "«Дээр байх» гэсэн ишлэл тодорхойгүй бөгөөд баримт бичиг, эсвэл өгүүлбэр байхгүй нөхцөлд тэдгээрийн хариуцлагыг тогтоох боломжгүй.",
      lawArticleId: "ГЭЗ",
      suggestion: "«Ашиглалтын зардлын өгүүлбэрийг 3.2 дахь жагсаалтад заасан бүх зүйлс гэж ойлгоно» гэж тодруулж бичих.",
      source: "ai",
      status: "pending",
    },
    {
      id: "fnd_i3",
      clauseQuote: "Бүх төлбөрийг Монгол улсын Төрийн банкны Хан-Уул филиалд, 1234 5678 9012 3456 гэсэн данстай хийнэ.",
      risk: "low",
      explanation: "Дансны дугаар дутуу байна. Төлбөр хийх дансны дугаар бүрэн байх шаардлагатай.",
      lawArticleId: "ГЭЗ",
      suggestion: "Дансны дугаарыг бүтэн бичих.",
      source: "ai",
      status: "pending",
    },
  ];

  inReviewFindings.forEach((f, i) => {
    findings.push({ ...f, checkId: "chk_inreview_1", createdAt: hoursAgo(2.5 - i * 0.1) });
  });

  consents.push(
    { id: "con_5", checkId: "chk_inreview_1", kind: "ai_processing", granted: true, at: hoursAgo(2.9) },
    { id: "con_6", checkId: "chk_inreview_1", kind: "lawyer_review", granted: true, at: hoursAgo(2.9) },
    { id: "con_7", checkId: "chk_inreview_1", kind: "data_retention", granted: true, at: hoursAgo(2.9) },
    { id: "con_8", checkId: "chk_inreview_1", kind: "sms_notifications", granted: false, at: hoursAgo(2.9) }
  );

  payments.push({
    id: "pay_2",
    checkId: "chk_inreview_1",
    userId: "usr_demo",
    amount: 25000,
    status: "paid",
    invoiceId: "INV-DEMO-0002",
    qrCode: "",
    package: "urgent",
    createdAt: hoursAgo(2.8),
    paidAt: hoursAgo(2.8),
    expiresAt: hoursAgo(2.55),
  });

  // Check 3: awaiting payment (labor)
  checks.push({
    id: "chk_awaitpay_1",
    userId: "usr_demo",
    type: "labor",
    package: "standard",
    status: "awaiting_payment",
    createdAt: hoursAgo(0.3),
    overallRisk: "low",
    pages: 5,
    amount: 15000,
  });

  texts.push({
    checkId: "chk_awaitpay_1",
    originalText: SAMPLE_LABOR_CONTRACT,
    maskedText: laborMask.maskedText,
    masks: laborMask.masks,
    createdAt: hoursAgo(0.3),
  });

  payments.push({
    id: "pay_3",
    checkId: "chk_awaitpay_1",
    userId: "usr_demo",
    amount: 15000,
    status: "pending",
    invoiceId: "INV-DEMO-0003",
    qrCode: "",
    package: "standard",
    createdAt: hoursAgo(0.3),
    expiresAt: hoursFromNow(0.2),
  });

  // Check 4: draft in queue (labor) - unclaimed, waiting for lawyer
  checks.push({
    id: "chk_queue_1",
    userId: "usr_demo",
    type: "labor",
    package: "standard",
    status: "ai_ready",
    createdAt: hoursAgo(1.5),
    paidAt: hoursAgo(1.4),
    slaDueAt: hoursFromNow(2.6),
    overallRisk: "mid",
    pages: 5,
    amount: 15000,
  });

  texts.push({
    checkId: "chk_queue_1",
    originalText: SAMPLE_LABOR_CONTRACT,
    maskedText: laborMask.maskedText,
    masks: laborMask.masks,
    createdAt: hoursAgo(1.4),
  });

  const queueFindings: Omit<Finding, "checkId" | "createdAt">[] = [
    {
      id: "fnd_q1",
      clauseQuote: "Цалин сарын 10-нд Төрийн банкны дансаар олгоно.",
      risk: "mid",
      explanation:
        "ХМЛ 111.2-ийн дагуу цалин олгох хугацаа ажлын хугацаа дуусахаас өмнө тогтоосон байх ёстой. Сарын 10-нд олгох нь зар сарын эхний 10 хоногт төлөгдөхгүй боломжтой.",
      lawArticleId: "ХМЛ 111.2",
      suggestion:
        "«Цалиныг ажлын хугацааны эцэс болон өмнөх сарын хугацааны 10-нд олгоно» гэж тодруулж бичих.",
      source: "ai",
      status: "pending",
    },
    {
      id: "fnd_q2",
      clauseQuote: "Цалин өгөх хугацааг өнгөрсөн бол ажилтан өдөр тутмын үнэлгээнд хүчин төгөлдөршсөн эсэхийг эргүүлж шаардах эрхтэй.",
      risk: "high",
      explanation:
        "Энэ өгүүлбэр нь ажилтныг үйлчилгээний гэрээгээ чөлөөтэй орхиж чадах эрхийг олгох бөгөөд төлбөрийг төлөөгүй бол ажлаа гүйцэтгэх хүрээг хязгаарлах эрхгүй болгож байна.",
      lawArticleId: "ХМЛ 111.2",
      suggestion:
        "«Цалин төлөгдөөгүй бол ажлтан өдөр тутмын үнэлгээнд хүчин төгөлдөршсөн эсэхийг эргүүлж шаардах эрхтэй бөгөөд ажлын хугацаа дуусах хүртэл ажлаа гүйцэтгэх үүрэгтэй» гэж тодруулах.",
      source: "ai",
      status: "pending",
    },
    {
      id: "fnd_q3",
      clauseQuote: "Ажилтан жилд 14 хоногийн амгалан авна.",
      risk: "low",
      explanation: "Хуулийн хэрийн шаардлагыг хангасан бөгөөд амгаланы үеийн цалингийн нэмэгдэхүүнийг дурдаагүй байна.",
      lawArticleId: "ЭМ 142.2",
      suggestion: "«Амгаланы үеийн цалинд хөдөлмөрийн дундаж хөдөлмөрийн цалинд нэмэгдэнэ» гэж тодруулах.",
      source: "ai",
      status: "pending",
    },
  ];

  queueFindings.forEach((f, i) => {
    findings.push({ ...f, checkId: "chk_queue_1", createdAt: hoursAgo(1.2 - i * 0.1) });
  });

  payments.push({
    id: "pay_4",
    checkId: "chk_queue_1",
    userId: "usr_demo",
    amount: 15000,
    status: "paid",
    invoiceId: "INV-DEMO-0004",
    qrCode: "",
    package: "standard",
    createdAt: hoursAgo(1.4),
    paidAt: hoursAgo(1.4),
    expiresAt: hoursAgo(1.15),
  });

  // Check 5: overdue (SLA breach) - claimed but expired
  checks.push({
    id: "chk_overdue_1",
    userId: "usr_demo",
    type: "rental",
    package: "standard",
    status: "in_review",
    createdAt: hoursAgo(30),
    paidAt: hoursAgo(29.5),
    slaDueAt: hoursAgo(1),
    lawyerId: "law_002",
    lawyerName: "Д.Азар",
    overallRisk: "mid",
    pages: 7,
    amount: 15000,
  });

  texts.push({
    checkId: "chk_overdue_1",
    originalText: SAMPLE_RENTAL_CONTRACT,
    maskedText: rentalMask.maskedText,
    masks: rentalMask.masks,
    createdAt: hoursAgo(29.5),
  });

  findings.push({
    id: "fnd_o1",
    checkId: "chk_overdue_1",
    clauseQuote: "Нөхцөл зөрсөн талын 3 өдөгт хариуцлагын тогтоосон хэмжээгээр төлбөрийг төлөх ёстой.",
    risk: "mid",
    explanation:
      "Хариуцлагын хэмжээ тодорхойгүй тул төлбөрийн тооцооллын арга зүйг тогтоох шаардлагатай.",
    lawArticleId: "ГЭЗ",
    suggestion: "Нөхцөл зөрсөн тохиолдолд түрээсийн сарын 1.5 дахин хэмжээгээр хариуцлагыг тогтоох.",
    source: "ai",
    status: "pending",
    createdAt: hoursAgo(29),
  });

  payments.push({
    id: "pay_5",
    checkId: "chk_overdue_1",
    userId: "usr_demo",
    amount: 15000,
    status: "paid",
    invoiceId: "INV-DEMO-0005",
    qrCode: "",
    package: "standard",
    createdAt: hoursAgo(29.5),
    paidAt: hoursAgo(29.5),
    expiresAt: hoursAgo(29.25),
  });

  return {
    checks,
    findings,
    texts,
    consents,
    payments,
    questions,
    lawyers: seedLawyers,
    laws: seedLaws,
    audit: [] as AuditEntry[],
    pricing: { standard: 15000, urgent: 25000 } as Pricing,
  };
}

// ---------------------------------------------------------------------------
// Store (module-level singleton; survives hot reload in dev)
// ---------------------------------------------------------------------------

type Store = ReturnType<typeof buildSeed>;

const globalStore = globalThis as unknown as { __leaselensStore?: Store };

if (!globalStore.__leaselensStore) {
  globalStore.__leaselensStore = buildSeed();
}

export const store: Store = globalStore.__leaselensStore;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getCheck(id: string) {
  return store.checks.find((c) => c.id === id);
}

export function getFindings(checkId: string) {
  return store.findings.filter((f) => f.checkId === checkId);
}

export function getText(checkId: string) {
  return store.texts.find((t) => t.checkId === checkId);
}

export function getPaymentsForCheck(checkId: string) {
  return store.payments.filter((p) => p.checkId === checkId);
}

export function getLawyer(id: string) {
  return store.lawyers.find((l) => l.id === id);
}

export function getQuestions(checkId: string) {
  return store.questions.filter((q) => q.checkId === checkId);
}

export function recalcOverallRisk(checkId: string): RiskLevel {
  const findings = getFindings(checkId).filter((f) => f.status !== "rejected");
  const result = calculateOverallRisk(findings);
  const check = getCheck(checkId);
  if (check) check.overallRisk = result.overallRisk;
  return result.overallRisk;
}

export function addAudit(
  actorId: string,
  actorRole: string,
  action: string,
  targetType: string,
  targetId: string
) {
  store.audit.push({
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    actorId,
    actorRole,
    action,
    targetType,
    targetId,
    at: new Date().toISOString(),
  });
}

let idCounter = 100;
export function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${idCounter}`;
}
