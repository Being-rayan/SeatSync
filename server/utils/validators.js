const ApiError = require("./apiError");

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeLower(value) {
  return normalizeText(value).toLowerCase();
}

function assertRequiredString(value, fieldName, options = {}) {
  const normalized = normalizeText(value);
  const minLength = options.minLength ?? 1;
  const maxLength = options.maxLength ?? 255;

  if (!normalized || normalized.length < minLength || normalized.length > maxLength) {
    throw new ApiError(400, `${fieldName} is invalid.`);
  }

  return normalized;
}

function assertEmail(value) {
  const email = normalizeLower(value);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    throw new ApiError(400, "Email address is invalid.");
  }

  return email;
}

function assertPassword(value) {
  const password = String(value || "");

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long.");
  }

  return password;
}

function assertJourneyType(value) {
  const journeyType = normalizeLower(value);

  if (!["train", "bus"].includes(journeyType)) {
    throw new ApiError(400, "Journey type must be train or bus.");
  }

  return journeyType;
}

function assertDate(value, fieldName) {
  const dateValue = normalizeText(value);
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(dateValue)) {
    throw new ApiError(400, `${fieldName} must use YYYY-MM-DD format.`);
  }

  return dateValue;
}

function assertPositiveInteger(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, `${fieldName} must be a positive integer.`);
  }

  return parsed;
}

function assertOptionalMessage(value, maxLength = 280) {
  const message = normalizeText(value);

  if (!message) {
    return "";
  }

  if (message.length > maxLength) {
    throw new ApiError(400, `Message cannot exceed ${maxLength} characters.`);
  }

  return message;
}

function safeJson(value) {
  return value || {};
}

module.exports = {
  assertDate,
  assertEmail,
  assertJourneyType,
  assertOptionalMessage,
  assertPassword,
  assertPositiveInteger,
  assertRequiredString,
  normalizeLower,
  normalizeText,
  safeJson
};
