const test = require("node:test");
const assert = require("node:assert/strict");

const WhisperManager = require("../../src/helpers/whisper");
const {
  normalizeAutoDetectLanguages,
  resolveLanguageToForce,
} = require("../../src/helpers/autoDetectLanguages");

const detected = (language_probabilities) => ({ text: "first pass", language_probabilities });

function createManager(responses) {
  const manager = new WhisperManager();
  const requests = [];
  manager.serverManager.isAvailable = () => true;
  manager.serverManager.start = async () => {};
  manager.serverManager.transcribe = async (_buffer, options) => {
    requests.push(options);
    return responses[requests.length - 1];
  };
  manager.getModelPath = () => __filename;
  return { manager, requests };
}

test("Ukrainian detected as Russian is decoded again as Ukrainian", async () => {
  const { manager, requests } = createManager([
    detected({ ru: 0.62, uk: 0.37 }),
    { text: "привіт" },
  ]);
  manager.setAutoDetectLanguages(["uk", "en-US"]);

  const result = await manager.transcribeLocalWhisper(Buffer.from("audio"), {
    model: "turbo",
    language: "auto",
  });

  assert.equal(result.text, "привіт");
  assert.equal(requests.length, 2);
  assert.equal(requests[0].responseFormat, "verbose_json");
  assert.equal(requests[1].language, "uk");
  assert.equal(requests[1].responseFormat, undefined);
});

test("a detected language on the list keeps the first pass", async () => {
  const { manager, requests } = createManager([detected({ en: 0.97, uk: 0.02 })]);
  manager.setAutoDetectLanguages(["uk", "en"]);

  const result = await manager.transcribeLocalWhisper(Buffer.from("audio"), { model: "turbo" });

  assert.equal(result.text, "first pass");
  assert.equal(requests.length, 1);
});

test("silence is not decoded again in a listed language", async () => {
  const { manager, requests } = createManager([
    { text: "[BLANK_AUDIO]", language_probabilities: { ru: 0.9 } },
  ]);
  manager.setAutoDetectLanguages(["uk", "en"]);

  const result = await manager.transcribeLocalWhisper(Buffer.from("audio"), { model: "turbo" });

  assert.equal(result.success, false);
  assert.equal(requests.length, 1);
});

test("an empty list or a fixed language leaves transcription untouched", async () => {
  const unrestricted = createManager([{ text: "any" }]);
  await unrestricted.manager.transcribeLocalWhisper(Buffer.from("audio"), {
    model: "turbo",
    language: "auto",
  });
  assert.equal(unrestricted.requests[0].responseFormat, undefined);

  const fixed = createManager([{ text: "fixed" }]);
  fixed.manager.setAutoDetectLanguages(["uk", "en"]);
  await fixed.manager.transcribeLocalWhisper(Buffer.from("audio"), {
    model: "turbo",
    language: "de",
  });
  assert.equal(fixed.requests.length, 1);
  assert.equal(fixed.requests[0].language, "de");
  assert.equal(fixed.requests[0].responseFormat, undefined);
});

test("the forced language is the listed one Whisper rated highest", () => {
  assert.equal(
    resolveLanguageToForce({ language_probabilities: { ru: 0.6, en: 0.3, uk: 0.1 } }, ["uk", "en"]),
    "en"
  );
});

test("with no listed language rated, the first listed language is forced", () => {
  assert.equal(
    resolveLanguageToForce({ language_probabilities: { ru: 0.99 } }, ["uk", "en"]),
    "uk"
  );
});

test("a response without language probabilities keeps the first pass", () => {
  assert.equal(resolveLanguageToForce({ text: "hi" }, ["uk", "en"]), null);
});

test("registry codes become Whisper codes, without auto or duplicates", () => {
  assert.deepEqual(normalizeAutoDetectLanguages(["uk", "en-US", "en-GB", "auto", "", 3]), [
    "uk",
    "en",
  ]);
  assert.deepEqual(normalizeAutoDetectLanguages(null), []);
});
