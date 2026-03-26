const PDFDocument = require("pdfkit");
const fs = require("fs");

async function generateReport(data, imagePath) {
  return new Promise((resolve) => {
    const fileName = `report_${Date.now()}.pdf`;
    const filePath = `reports/${fileName}`;

    if (!fs.existsSync("reports")) {
      fs.mkdirSync("reports");
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 50
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // =========================
    // 📄 PAGE 1 (SUMMARY)
    // =========================
    doc.fontSize(22).text("Accessibility Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`URL: ${data.url}`);
    doc.moveDown();

    // Score
    doc
      .fontSize(30)
      .fillColor(data.score > 80 ? "green" : "red")
      .text(`Score: ${data.score}`, { align: "center" });

    doc.moveDown(2);

    // Summary
    const total = data.agents.perceivable.length;

    doc.fillColor("black").fontSize(14).text("Summary:");
    doc.moveDown();

    doc.fillColor("red").text(`❌ Issues Found: ${total}`);
    doc.fillColor("green").text(
      `✔ Good: ${total === 0 ? "All checks passed" : "Some checks passed"}`
    );

    // =========================
    // 📄 PAGE 2 (SCREENSHOT)
    // =========================
    doc.addPage();

    doc.fontSize(16).fillColor("black").text("Visual Analysis");
    doc.moveDown();

    try {
      doc.image(imagePath, {
        fit: [500, 700],
        align: "center"
      });
    } catch {}

    // =========================
    // 📄 PAGE 3 (ERRORS)
    // =========================
    doc.addPage();

    doc.fontSize(18).fillColor("red").text("❌ Issues");
    doc.moveDown();

    data.agents.perceivable.forEach((v, i) => {
      doc
        .fillColor("black")
        .fontSize(10)
        .text(`${i + 1}. ${v.id} (${v.impact})`);
      doc.moveDown(0.5);
    });

    // =========================
    // 📄 PAGE 4 (OPERABLE)
    // =========================
    doc.addPage();

    doc.fontSize(18).fillColor("blue").text("🎮 Operable Checks");
    doc.moveDown();

    if (data.agents.operable.length === 0) {
      doc.fillColor("green").text("✔ No operable issues found");
    } else {
      data.agents.operable.forEach((o, i) => {
        doc.fillColor("red").text(`${i + 1}. ${o.issue}`);
      });
    }

    // =========================
    // 📄 PAGE 5 (AI INSIGHTS)
    // =========================
    doc.addPage();

    doc.fontSize(18).fillColor("blue").text("🤖 AI Insights");
    doc.moveDown();

    data.agents.understandable.forEach((u, i) => {
      doc
        .fillColor("black")
        .fontSize(10)
        .text(`${i + 1}. ${u.explanation}`);
      doc.moveDown();
    });

    doc.end();

    stream.on("finish", () => {
      resolve(filePath);
    });
  });
}

module.exports = generateReport;