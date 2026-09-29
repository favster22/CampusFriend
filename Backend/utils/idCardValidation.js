
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const MIN_SPAN_YEARS = 1.5; 
const MAX_SPAN_YEARS = 4.5;

const MAX_IMAGE_CHARS = 3.4 * 1024 * 1024;
const IMAGE_RE = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;

function isValidImage(dataUrl) {
  return (
    typeof dataUrl === "string" &&
    dataUrl.length <= MAX_IMAGE_CHARS &&
    IMAGE_RE.test(dataUrl)
  );
}

function validateCardValidity(validFrom, validUntil, now = new Date()) {
  const from = new Date(validFrom);
  const until = new Date(validUntil);

  if (isNaN(from) || isNaN(until)) {
    return { ok: false, message: "Could not read the validity dates on your student ID card." };
  }
  if (until <= from) {
    return { ok: false, message: "The ID card's expiry date is before its start date." };
  }
  if (until < now) {
    return { ok: false, message: "Your student ID card has expired. Please use a valid, current card." };
  }
 
  if (from.getTime() > now.getTime() + 45 * 24 * 60 * 60 * 1000) {
    return { ok: false, message: "Your student ID card is not valid yet." };
  }

  const spanYears = (until - from) / MS_PER_YEAR;
  if (spanYears < MIN_SPAN_YEARS || spanYears > MAX_SPAN_YEARS) {
    return {
      ok: false,
      message: `The ID card period (${spanYears.toFixed(1)} years) does not match a 4-year programme of study.`,
    };
  }

  return { ok: true, from, until, spanYears };
}

module.exports = { validateCardValidity, isValidImage };