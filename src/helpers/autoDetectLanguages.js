function toWhisperCode(languageCode) {
  return String(languageCode).split("-")[0].toLowerCase();
}

function normalizeAutoDetectLanguages(languageCodes) {
  if (!Array.isArray(languageCodes)) return [];
  const codes = languageCodes
    .filter((code) => typeof code === "string" && code && code !== "auto")
    .map(toWhisperCode);
  return [...new Set(codes)];
}

function detectedLanguageCode(response) {
  const probabilities = response?.language_probabilities;
  if (!probabilities || typeof probabilities !== "object") return null;
  let best = null;
  for (const [code, probability] of Object.entries(probabilities)) {
    if (best === null || probability > probabilities[best]) best = code;
  }
  return best;
}

function resolveLanguageToForce(response, allowedLanguages) {
  if (allowedLanguages.length === 0) return null;
  const detected = detectedLanguageCode(response);
  if (detected === null || allowedLanguages.includes(detected)) return null;

  const probabilities = response.language_probabilities;
  return allowedLanguages.reduce((best, code) =>
    (probabilities[code] ?? 0) > (probabilities[best] ?? 0) ? code : best
  );
}

module.exports = {
  normalizeAutoDetectLanguages,
  resolveLanguageToForce,
};
