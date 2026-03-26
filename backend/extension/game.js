(() => {

  alert("🎮 Accessibility Game Mode ON\n\nUse TAB to navigate. Mouse disabled!");

  // remove old overlays
  document.querySelectorAll(".a11y-box, .a11y-card").forEach(el => el.remove());

  // disable mouse
  document.body.style.pointerEvents = "none";

  let score = 100;
  let visited = new Set();

  const allFocusable = [
    ...document.querySelectorAll("button, a, input, select, textarea, [tabindex]")
  ];

  // blur screen
  document.body.style.filter = "brightness(0.1)";

  function highlight(el) {
    document.querySelectorAll(".a11y-game").forEach(e => e.remove());

    const rect = el.getBoundingClientRect();

    const box = document.createElement("div");
    box.className = "a11y-game";

    box.style = `
      position:absolute;
      top:${rect.top + window.scrollY}px;
      left:${rect.left + window.scrollX}px;
      width:${rect.width}px;
      height:${rect.height}px;
      border:3px solid yellow;
      z-index:999999;
      pointer-events:none;
    `;

    const label = document.createElement("div");
    label.className = "a11y-game";

    label.innerText = "FOCUS";

    label.style = `
      position:absolute;
      top:${rect.top + window.scrollY - 20}px;
      left:${rect.left + window.scrollX}px;
      background:yellow;
      color:black;
      font-size:11px;
      padding:2px 6px;
      z-index:1000000;
    `;

    document.body.appendChild(box);
    document.body.appendChild(label);
  }

  document.addEventListener("focusin", (e) => {
    const el = e.target;

    highlight(el);

    // track visited
    visited.add(el);

    // ❌ check issues
    if (el.tagName === "IMG" && !el.alt) score -= 5;
    if (el.tagName === "BUTTON" && !el.innerText.trim()) score -= 5;
    if (el.tagName === "A" && !el.innerText.trim()) score -= 5;

  });

  // END GAME
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {

      document.body.style.pointerEvents = "auto";
      document.body.style.filter = "none";

      document.querySelectorAll(".a11y-game").forEach(e => e.remove());

      const total = allFocusable.length;
      const covered = visited.size;

      alert(`
🎮 Game Over!

Score: ${score}
Visited: ${covered}/${total}

${covered < total ? "❌ You missed elements!" : "✅ Perfect navigation!"}
      `);
    }
  });

})();