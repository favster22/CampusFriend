
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
export const MIN_SPAN_YEARS = 3.5;
export const MAX_SPAN_YEARS = 4.5;

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Resize + re-encode as JPEG so the request stays small (~200-400KB). */
export function compressImage(file, maxSize = 1400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Please choose an image file."));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read that image.")); };
    img.src = url;
  });
}

/** OCR an image (data URL) and return the raw text. */
export async function readCardText(dataUrl) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(dataUrl);
    return data.text || "";
  } finally {
    await worker.terminate();
  }
}

export function extractValidity(text, now = new Date()) {
  if (!text) return null;
  const t = text.replace(/[|_]/g, " ");
  const thisYear = now.getFullYear();
  const okYear = (y) => y >= thisYear - 10 && y <= thisYear + 8;
  const dates = [];

  // dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy
  for (const m of t.matchAll(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](20\d{2})\b/g)) {
    const [d, mo, y] = [+m[1], +m[2], +m[3]];
    if (okYear(y) && mo >= 1 && mo <= 12) dates.push(new Date(y, mo - 1, d));
  }
  // yyyy-mm-dd
  for (const m of t.matchAll(/\b(20\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/g)) {
    const [y, mo, d] = [+m[1], +m[2], +m[3]];
    if (okYear(y) && mo >= 1 && mo <= 12) dates.push(new Date(y, mo - 1, d));
  }
  // "12 September 2022" / "Sep 2022" / "September, 2022"
  for (const m of t.matchAll(/\b(?:(\d{1,2})(?:st|nd|rd|th)?\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s+(20\d{2})\b/gi)) {
    const y = +m[3];
    if (okYear(y)) dates.push(new Date(y, MONTHS[m[2].toLowerCase()], m[1] ? +m[1] : 1));
  }

  if (dates.length >= 2) {
    dates.sort((a, b) => a - b);
    return { validFrom: dates[0], validUntil: dates[dates.length - 1], source: "dates" };
  }

  // years only
  const years = [...new Set([...t.matchAll(/\b(20\d{2})\b/g)].map((m) => +m[1]).filter(okYear))].sort();
  if (years.length >= 2) {
    const first = years[0], last = years[years.length - 1];
    return { validFrom: new Date(first, 8, 1), validUntil: new Date(last, 7, 31), source: "years" };
  }
  return null;
}

/** Same rules as the server: not expired, not future-dated, ~4-year span. */
export function checkValidity(validFrom, validUntil, now = new Date()) {
  if (!validFrom || !validUntil) {
    return { ok: false, message: "We couldn't find the start and expiry dates on your ID card. Upload a clearer, well-lit photo showing the dates." };
  }
  if (validUntil < now) {
    return { ok: false, message: "This student ID card has expired. Please use a valid, current card." };
  }
  if (validFrom.getTime() > now.getTime() + 45 * 24 * 60 * 60 * 1000) {
    return { ok: false, message: "This student ID card is not valid yet." };
  }
  const span = (validUntil - validFrom) / MS_PER_YEAR;
  if (span < MIN_SPAN_YEARS || span > MAX_SPAN_YEARS) {
    return { ok: false, message: `The card period (${span.toFixed(1)} years) doesn't match a 4-year programme of study.` };
  }
  return { ok: true, span };
}

export const fmtDate = (d) =>
  d ? d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";