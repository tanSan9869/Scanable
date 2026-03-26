require("dotenv").config();
const axios = require("axios");

const API_KEY = process.env.GEMINI_API_KEY;
const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const FEATHERLESS_API_KEY = process.env.FEATHERLESS_API_KEY;
const FEATHERLESS_API_URL = process.env.FEATHERLESS_API_URL || "https://api.featherless.ai/v1/chat/completions";
const FEATHERLESS_MODEL = process.env.FEATHERLESS_MODEL || "deepseek-ai/DeepSeek-V3.2";

function normalizeModelName(value) {
  return String(value || "").replace(/^models\//, "");
}

function toPlainText(value) {
  return String(value || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isGeminiKeyOrQuotaError(err) {
  const status = err?.response?.status;
  const responsePayload = JSON.stringify(err?.response?.data || {}).toLowerCase();
  const message = String(err?.message || "").toLowerCase();

  if ([401, 403, 429].includes(status)) return true;

  return [
    "quota",
    "rate limit",
    "resource_exhausted",
    "api key",
    "invalid",
    "expired",
    "permission denied",
    "billing",
  ].some((token) => responsePayload.includes(token) || message.includes(token));
}

async function runFeatherlessPrompt(prompt) {
  if (!FEATHERLESS_API_KEY) {
    throw new Error("Missing FEATHERLESS_API_KEY");
  }

  const res = await axios.post(
    FEATHERLESS_API_URL,
    {
      model: FEATHERLESS_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an accessibility assistant. Return plain text only with no markdown, lists, or code blocks.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    },
    {
      headers: {
        Authorization: `Bearer ${FEATHERLESS_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    }
  );

  return res.data?.choices?.[0]?.message?.content || "No explanation";
}

async function getAvailableModel() {
  try {
    const res = await axios.get(`${BASE}?key=${API_KEY}`);

    const model = res.data.models.find(m =>
      m.supportedGenerationMethods?.includes("generateContent")
    );

    return normalizeModelName(model?.name) || null;

  } catch {
    return null;
  }
}

async function runLLM(issues) {
  try {
    const providerPreference = String(process.env.AI_PROVIDER || "gemini").toLowerCase();
    const useFeatherlessFirst = providerPreference === "featherless";

    const discoveredModel = await getAvailableModel();
    const configuredModel = normalizeModelName(process.env.GEMINI_MODEL || "gemini-2.0-flash");
    const geminiModel = discoveredModel || configuredModel;

    const results = [];

    for (const issue of issues.slice(0, 3)) {
      const prompt = [
        "Explain this accessibility issue in plain text.",
        "Do not use markdown, headings, bullets, or code blocks.",
        "Keep it short: 2-4 sentences with one practical fix.",
        `Issue: ${issue.description}`,
      ].join("\n");

      let text = "No explanation";

      if (useFeatherlessFirst) {
        try {
          text = await runFeatherlessPrompt(prompt);
        } catch (fallbackErr) {
          if (!geminiModel || !API_KEY) {
            throw fallbackErr;
          }

          const res = await axios.post(
            `${BASE}/${geminiModel}:generateContent?key=${API_KEY}`,
            {
              contents: [{ parts: [{ text: prompt }] }],
            }
          );

          text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No explanation";
        }
      } else {
        try {
          if (!geminiModel || !API_KEY) {
            throw new Error("Gemini is not configured");
          }

          const res = await axios.post(
            `${BASE}/${geminiModel}:generateContent?key=${API_KEY}`,
            {
              contents: [{ parts: [{ text: prompt }] }],
            }
          );

          text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No explanation";
        } catch (geminiErr) {
          const shouldFallback = isGeminiKeyOrQuotaError(geminiErr) || !geminiModel || !API_KEY;
          if (!shouldFallback) {
            throw geminiErr;
          }

          text = await runFeatherlessPrompt(prompt);
        }
      }

      results.push({
        id: issue.id,
        explanation: toPlainText(text)
      });
    }

    return results;

  } catch (err) {
    console.log("LLM ERROR:", err.response?.data || err.message);
    return [];
  }
}

module.exports = runLLM;