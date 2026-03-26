const sharp = require("sharp");

async function drawBoxes(imagePath, violations) {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    const width = metadata.width;
    const height = metadata.height;

    const rects = violations
      .flatMap((v, i) =>
        v.nodes.map((n, j) => {
          const x = 20 + j * 30;
          const y = 20 + i * 80;

          return `<rect x="${x}" y="${y}" width="250" height="60"
            fill="none" stroke="red" stroke-width="3"/>`;
        })
      )
      .join("");

    const svg = `
      <svg width="${width}" height="${height}">
        ${rects}
      </svg>
    `;

    const output = imagePath.replace(".png", "_boxed.png");

    await image
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .toFile(output);

    return output;

  } catch (err) {
    console.log("Draw error:", err.message);
    return imagePath;
  }
}

module.exports = drawBoxes;