const path = require("path");
const { existsSync } = require("fs");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

require("dotenv").config({ path: path.join(__dirname, ".env"), override: true });

const TELEGRAM_TOKEN = String(process.env.TELEGRAM_TOKEN || "").trim();
const SCAN_API_BASE = process.env.SCAN_API_BASE || "http://localhost:5000";

if (!TELEGRAM_TOKEN) {
  console.error("❌ TELEGRAM_TOKEN is missing in .env");
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

console.log(`🤖 Bot started. Using scan API: ${SCAN_API_BASE}`);

function toLocalPath(publicPath) {
  if (!publicPath || typeof publicPath !== "string") return null;
  const cleaned = publicPath.replace(/^\/+/, "");
  return path.join(__dirname, cleaned);
}

bot.onText(/^\/start$/i, async (msg) => {
  await bot.sendMessage(msg.chat.id, "👋 Send a website URL (http/https) to scan.");
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = String(msg.text || "").trim();

  if (!text || text.startsWith("/")) {
    if (!text.startsWith("/start")) {
      await bot.sendMessage(chatId, "👉 Send a website URL to scan");
    }
    return;
  }

  if (!/^https?:\/\//i.test(text)) {
    await bot.sendMessage(chatId, "❌ Send a valid URL starting with http:// or https://");
    return;
  }

  try {
    await bot.sendMessage(chatId, "🚀 Scanning website...");

    const { data } = await axios.post(`${SCAN_API_BASE}/scan`, { url: text }, { timeout: 120000 });

    const score = data?.summary?.score ?? data?.score ?? 0;
    const totalIssues = data?.summary?.totalIssues ?? data?.totalIssues ?? 0;

    const screenshotPath = toLocalPath(data?.screenshot);
    if (screenshotPath && existsSync(screenshotPath)) {
      await bot.sendPhoto(chatId, screenshotPath);
    }

    const reportPath = toLocalPath(data?.report);
    if (reportPath && existsSync(reportPath)) {
      await bot.sendDocument(chatId, reportPath);
    }

    await bot.sendMessage(chatId, `✅ Scan Complete\n\nScore: ${score}\nIssues: ${totalIssues}`);
  } catch (err) {
    const status = err?.response?.status;
    const reason = err?.response?.data?.error || err.message;
    console.error("Bot scan failed:", reason);
    await bot.sendMessage(chatId, `❌ Scan failed${status ? ` (${status})` : ""}. ${reason}`);
  }
});