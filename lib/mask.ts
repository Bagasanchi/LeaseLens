/**
 * PII Masking for Mongolian contracts
 * Masks: register numbers, phone numbers, bank accounts, names, addresses, health data
 */

// Mongolian register number patterns (various formats)
const REGISTER_PATTERNS = [
  // Format: XXXXXXXXXX (10 digits)
  /\b\d{10}\b/g,
  // Format: XX XXXXXX (2+6 digits with space)
  /\b\d{2}\s?\d{6}\b/g,
  // Format with letters: АА12345678 or similar
  /\b[А-ЯA-Z]{2}\d{8}\b/g,
];

// Mongolian phone numbers: +976 XX XXXX XXXX, 99XXXXXXXX, 88XXXXXXXX, etc.
const PHONE_PATTERNS = [
  // +976 XX XXXX XXXX
  /\+976\s?\d{2}\s?\d{3}\s?\d{3}/g,
  // 976XXXXXXXXX (without +)
  /976\d{9}/g,
  // Local format: XX XXXX XXXX (8 digits after first 2)
  /\b\d{2}\s?\d{3}\s?\d{3}\b/g,
  // Mobile prefixes: 99, 88, 98, 97, 96, 95, 94, 93, 91, 89, 88, 86, 85, 80
  /\b(?:99|98|97|96|95|94|93|91|89|88|86|85|80)\d{6}\b/g,
];

// Bank account numbers (Mongolian banks: 14-20 digits)
const BANK_ACCOUNT_PATTERNS = [
  // Standard 16-20 digit account numbers
  /\b\d{16,20}\b/g,
  // With spaces: XXXX XXXX XXXX XXXX
  /\b\d{4}\s\d{4}\s\d{4}\s\d{4}\b/g,
  // Card-like: XXXX XXXX XXXX XXXX
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
];

// Mongolian names: Surname + Given name (Cyrillic)
// Pattern: Capitalized word + space + Capitalized word(s)
const NAME_PATTERNS = [
  // Full name: Овог Нэр (Cyrillic)
  /\b[А-ЯЁӨҮ][а-яёөү]+(?:\s+[А-ЯЁӨҮ][а-яёөү]+){1,3}\b/g,
  // With initials: О. Нэр
  /\b[А-ЯЁӨҮ]\.\s?[А-ЯЁӨҮ][а-яёөү]+\b/g,
  // Latin script names
  /\b[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
];

// Mongolian addresses
const ADDRESS_PATTERNS = [
  // District + Khoroo + Building + Apartment
  /\b(?:Сүхбаатар|Чингэлтэй|Баянгол|Баянзүрх|Налайх|Багануур|Баганхونغор|Сайншанд|Дархан|Эрдэнэт)\s+дуурест\s+\d+(?:-р)?\s+хороо/gi,
  // Street addresses
  /\b(?:гудамж|талбай|жуулч|зүүн|баруун|төв|хоёулаа)\s+\d+[а-яёөү]?/gi,
  // Building/apartment: XXX-т байр, XXX-т оршин, XXX тоот
  /\b\d{1,3}[-\s]?т?\s?(?:байр|оршин|тоот|хаан)\b/gi,
  // Postal codes: 5 digits
  /\b\d{5}\b/g,
];

// Health/medical data patterns
const HEALTH_PATTERNS = [
  // Diagnosis codes (ICD-10 like)
  /\b[A-Z]\d{2}(?:\.\d{1,2})?\b/g,
  // Medical terms in Mongolian
  /\b(?:эмч|эмнэлэг|шинжилгээ|диагноз|өвчин|хамгаалах|дурсгал|үйлдэл|онцгой|даврах|үнэт|хэтэрхий|нургийн|үрэвслийн|сэтгэлийн|нэрвний|дуу салхи|хөөрхөн|мөчний|шараа|гуурган|үсгийн|шийний|хамрын|уурийн|үлсний|харьсаарын|сорингийн|цагаан шулуун|шар шийд|шимтгэний|сүүний|идэлийн|хилийн|сурвангийн|цахилгаан|магнит|радио|УЗД|ЭКГ|ЭЭГ|МРТ|КТ|рентген|ультрадугаар| лаборатори|шинжилгээний|ангилал|консультаци|рецепт|эмийн|витамин|антибиотик|вакцин|иммун|аллерги|онкологи|кардиологи|невтрологи|гастроэнтерологи|дерматологи|эндокринологи|урологи|гинекологи|педиатри|ортопеди|травматологи|оftalмологи|ОРЛ|психиatri|наркологи|физиотерапи|реабилитаци|санэпидемиологи|гадаад эмч|дотоод эмч|ерөнхий эмч|агшны эмч|уурийн эмч|ныхны эмч|хүйсийн эмч|хүүхдийн эмч|хүйсийн хөгжил|химиотерапи|радиотерапи|операци|аппендицит|гастрит|улцерат|диабет|гипертони|ишемий|инфаркт|инсульт|апоплекс|паркинон|алцгеймер|эпилепси|мн|мн|мн)\b/gi,
];

// Email addresses
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Generic ID patterns (passport, ID cards)
const ID_PATTERNS = [
  // Mongolian ID card: 2 letters + 8 digits
  /\b[А-ЯA-Z]{2}\d{8}\b/g,
  // Passport: 1-2 letters + 7 digits
  /\b[A-Z]{1,2}\d{7}\b/g,
];

export type MaskType = "register" | "phone" | "bank" | "name" | "address" | "health" | "email" | "id";

export interface MaskResult {
  maskedText: string;
  masks: Array<{
    type: MaskType;
    original: string;
    masked: string;
    start: number;
    end: number;
  }>;
}

const MASK_TOKENS: Record<MaskType, string> = {
  register: "[РЕГИСТР]",
  phone: "[УТАС]",
  bank: "[ДАНС]",
  name: "[НЭР]",
  address: "[ХАЯГ]",
  health: "[ЭРҮЛ МЭНД]",
  email: "[ИМЕЙЛ]",
  id: "[ХҮНДЭТГЭЛ]",
};

export function maskPII(text: string): MaskResult {
  const masks: MaskResult["masks"] = [];
  let maskedText = text;
  let offset = 0;

  const applyMasks = (patterns: RegExp[], type: MaskType) => {
    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        if (match.index === undefined) continue;
        const original = match[0];
        const masked = MASK_TOKENS[type];
        const start = match.index + offset;
        const end = start + original.length;

        // Check if this region is already masked
        const alreadyMasked = masks.some(
          (m) => start < m.end && end > m.start
        );
        if (alreadyMasked) continue;

        masks.push({ type, original, masked, start, end });
      }
    }
  };

  // Apply all mask types
  applyMasks(REGISTER_PATTERNS, "register");
  applyMasks(PHONE_PATTERNS, "phone");
  applyMasks(BANK_ACCOUNT_PATTERNS, "bank");
  applyMasks(NAME_PATTERNS, "name");
  applyMasks(ADDRESS_PATTERNS, "address");
  applyMasks(HEALTH_PATTERNS, "health");
  applyMasks([EMAIL_PATTERN], "email");
  applyMasks(ID_PATTERNS, "id");

  // Sort masks by start position (descending) to replace from end to start
  masks.sort((a, b) => b.start - a.start);

  // Apply replacements
  for (const mask of masks) {
    maskedText =
      maskedText.slice(0, mask.start) +
      mask.masked +
      maskedText.slice(mask.end);
    offset += mask.masked.length - (mask.end - mask.start);
  }

  return { maskedText, masks };
}

export function unmaskText(maskedText: string, masks: MaskResult["masks"]): string {
  let result = maskedText;
  // Sort by start position ascending
  const sortedMasks = [...masks].sort((a, b) => a.start - b.start);
  let offset = 0;

  for (const mask of sortedMasks) {
    const start = mask.start + offset;
    const end = start + mask.masked.length;
    result = result.slice(0, start) + mask.original + result.slice(end);
    offset += mask.original.length - mask.masked.length;
  }

  return result;
}

export function getMaskStats(masks: MaskResult["masks"]) {
  const counts: Record<MaskType, number> = {
    register: 0,
    phone: 0,
    bank: 0,
    name: 0,
    address: 0,
    health: 0,
    email: 0,
    id: 0,
  };

  for (const mask of masks) {
    counts[mask.type]++;
  }

  return counts;
}