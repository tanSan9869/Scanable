const puppeteer = require("puppeteer");
const fs = require("fs");

const runAxe = require("./agents/perceivableOperable");
const runLLM = require("./agents/understandable");
const runRobust = require("./agents/robust");
const runOperable = require("./agents/operable");
const calculateScore = require("./utils/score");
const generateReport = require("./utils/generateReport");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function captureIssueScreenshots(page, violations) {
  const issueScreenshotsDir = "screenshots/issues";
  ensureDir(issueScreenshotsDir);

  const maxIssueScreenshots = Math.max(1, Number(process.env.MAX_ISSUE_SCREENSHOTS || 60));
  let captured = 0;

  for (let vIndex = 0; vIndex < violations.length; vIndex += 1) {
    const violation = violations[vIndex];
    if (!Array.isArray(violation.nodes)) continue;

    for (let nIndex = 0; nIndex < violation.nodes.length; nIndex += 1) {
      const node = violation.nodes[nIndex];
      if (captured >= maxIssueScreenshots) {
        return;
      }

      const selector = Array.isArray(node?.target) ? node.target[0] : null;
      if (!selector) continue;

      try {
        const handle = await page.$(selector);
        if (!handle) continue;

        await handle.evaluate((element) => {
          element.scrollIntoView({ behavior: "instant", block: "center", inline: "nearest" });
        });

        const fileName = `${Date.now()}-${vIndex}-${nIndex}.png`;
        const filePath = `${issueScreenshotsDir}/${fileName}`;

        await handle.screenshot({ path: filePath });
        node.issueScreenshot = `/${filePath}`;
        captured += 1;
      } catch {
        continue;
      }
    }
  }
}

async function crawlAndScan(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // folders
  if (!fs.existsSync("screenshots")) {
    fs.mkdirSync("screenshots");
  }
  if (!fs.existsSync("reports")) {
    fs.mkdirSync("reports");
  }

  await page.setDefaultNavigationTimeout(60000);

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await new Promise(r => setTimeout(r, 2000));

  } catch (err) {
    console.log("⚠️ Timeout:", url);
  }

  // 🧠 AXE
  const axeResults = await runAxe(page);

  const html = await page.content();

  // ⚡ PARALLEL AGENTS
  const [operable, robust, understandable] = await Promise.all([
    runOperable(page),
    runRobust(html),
    runLLM(axeResults.violations)
  ]);

  await captureIssueScreenshots(page, axeResults.violations);

  // 📊 SCORE
  const score = calculateScore(axeResults.violations);

  // 🔴 DRAW RED BOXES ON PAGE
  await page.evaluate((violations) => {
    violations.forEach(v => {
      v.nodes.forEach(node => {
        try {
          const el = document.querySelector(node.target[0]);
          if (!el) return;

          const rect = el.getBoundingClientRect();

          const box = document.createElement("div");
          box.style.position = "absolute";
          box.style.top = rect.top + window.scrollY + "px";
          box.style.left = rect.left + window.scrollX + "px";
          box.style.width = rect.width + "px";
          box.style.height = rect.height + "px";
          box.style.border = "3px solid red";
          box.style.zIndex = "9999";
          box.style.pointerEvents = "none";

          const label = document.createElement("div");
          label.innerText = v.id + " (" + v.impact + ")";
          label.style.position = "absolute";
          label.style.top = "-18px";
          label.style.left = "0";
          label.style.background = "red";
          label.style.color = "white";
          label.style.fontSize = "10px";
          label.style.padding = "2px 4px";

          box.appendChild(label);
          document.body.appendChild(box);

        } catch (e) {}
      });
    });
  }, axeResults.violations);

  // 📸 SCREENSHOT
  const fileName = `${Date.now()}.png`;
  const filePath = `screenshots/${fileName}`;

  await page.screenshot({
    path: filePath,
    fullPage: true
  });

  // 📄 GENERATE PDF
  const reportPath = await generateReport(
    {
      url,
      score,
      agents: {
        perceivable: axeResults.violations,
        operable,
        understandable,
        robust
      }
    },
    filePath
  );

  await browser.close();

  // 📦 FINAL RESPONSE
  return {
    url,
    score,
    screenshot: "/" + filePath,
    report: "/" + reportPath,
    totalIssues: axeResults.violations.length,
    agents: {
      perceivable: axeResults.violations,
      operable,
      understandable,
      robust
    }
  };
}

module.exports = crawlAndScan;