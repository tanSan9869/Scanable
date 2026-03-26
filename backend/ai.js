require("dotenv").config();
const axios = require("axios");

const API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const FEATHERLESS_API_KEY = process.env.FEATHERLESS_API_KEY;
const FEATHERLESS_API_URL = process.env.FEATHERLESS_API_URL || "https://api.featherless.ai/v1/chat/completions";
const FEATHERLESS_MODEL = process.env.FEATHERLESS_MODEL || "deepseek-ai/DeepSeek-V3.2";

function normalizeModelName(value) {
  return String(value || "").replace(/^models\//, "");
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

async function callFeatherless(prompt) {
  if (!FEATHERLESS_API_KEY) {
    throw new Error("Missing FEATHERLESS_API_KEY");
  }

  const response = await axios.post(
    FEATHERLESS_API_URL,
    {
      model: FEATHERLESS_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an accessibility assistant. Return plain text only.",
        },
        { role: "user", content: prompt },
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

  return response.data?.choices?.[0]?.message?.content;
}

async function getAIExplanation(issue) {
  try {
    const providerPreference = String(process.env.AI_PROVIDER || "gemini").toLowerCase();
    let models = [];

    // 🔍 discover models
    try {
      const res = await axios.get(`${BASE_URL}?key=${API_KEY}`);

      models = res.data.models
        .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
        .map(m => normalizeModelName(m.name));

      models.sort((a, b) => {
        if (a.includes("flash")) return -1;
        if (b.includes("flash")) return 1;
        if (a.includes("pro")) return -1;
        if (b.includes("pro")) return 1;
        return 0;
      });

    } catch {
      models = [normalizeModelName(process.env.GEMINI_MODEL || "gemini-2.0-flash")];
    }

    const prompt = `Explain this accessibility issue simply in plain text and give one practical fix:\n${issue.description}`;

    if (providerPreference === "featherless") {
      try {
        const fallbackText = await callFeatherless(prompt);
        if (fallbackText) return fallbackText;
      } catch {}
    }

    for (const model of models) {
      try {
        const response = await axios.post(
          `${BASE_URL}/${model}:generateContent?key=${API_KEY}`,
          {
            contents: [{ parts: [{ text: prompt }] }]
          }
        );

        return response.data.candidates[0].content.parts[0].text;

      } catch (err) {
        if (isGeminiKeyOrQuotaError(err)) {
          try {
            const fallbackText = await callFeatherless(prompt);
            if (fallbackText) return fallbackText;
          } catch {}
        }
      }
    }

    return issue.description + " → " + issue.help;

  } catch {
    return issue.description + " → " + issue.help;
  }
}

module.exports = getAIExplanation;