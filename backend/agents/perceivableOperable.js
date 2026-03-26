const axe = require("axe-core");

async function runAxe(page) {
  await page.addScriptTag({ path: require.resolve("axe-core") });

  const results = await page.evaluate(async () => {
    return await axe.run();
  });

  return results;
}

module.exports = runAxe;