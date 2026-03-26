async function runOperable(page) {
  const issues = [];

  try {
    const focusElements = [];

    // TAB navigation simulate + track focus
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");

      const data = await page.evaluate(() => {
        const el = document.activeElement;

        if (!el) return null;

        const style = window.getComputedStyle(el);

        return {
          tag: el.tagName,
          html: el.outerHTML,
          outline: style.outlineStyle,
          visible: style.visibility !== "hidden" && style.display !== "none"
        };
      });

      if (data) {
        focusElements.push(data);
      }
    }

    // ❌ No focus at all
    if (focusElements.length === 0) {
      issues.push({
        issue: "No keyboard focus detected on page",
        severity: "critical"
      });
    }

    // ❌ Focus stuck
    const unique = new Set(focusElements.map(f => f.html));
    if (unique.size <= 1) {
      issues.push({
        issue: "Focus is not moving between elements (keyboard trap)",
        severity: "serious"
      });
    }

    // ❌ No visible focus
    const noVisibleFocus = focusElements.some(f => f.outline === "none");
    if (noVisibleFocus) {
      issues.push({
        issue: "Focus indicator not visible on some elements",
        severity: "moderate"
      });
    }

  } catch (err) {
    issues.push({
      issue: "Keyboard navigation test failed",
      severity: "moderate"
    });
  }

  return issues;
}

module.exports = runOperable;