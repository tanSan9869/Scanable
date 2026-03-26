(() => {

  alert("🔥 Accessibility Inspector ON");

  if (window.__a11y_active) return;
  window.__a11y_active = true;

  let timeout;

  document.addEventListener("mouseover", (e) => {

    clearTimeout(timeout);

    timeout = setTimeout(() => {

      document.querySelectorAll(".a11y-box, .a11y-card").forEach(el => el.remove());

      const el = e.target;
      const tag = el.tagName.toLowerCase();

      let errors = [];
      let suggestions = [];

      // 🧠 INFO
      const role = el.getAttribute("role") || tag;
      const name =
        el.getAttribute("aria-label") ||
        el.innerText?.trim() ||
        el.alt ||
        "No accessible name";

      const focusable =
        el.tabIndex >= 0 ||
        ["button", "a", "input", "select", "textarea"].includes(tag);

      // ❌ ERROR RULES
      if (tag === "img" && !el.alt) errors.push("Image is missing alt text");
      if (tag === "button" && !el.innerText.trim()) errors.push("Button has no label");
      if (tag === "a" && !el.innerText.trim()) errors.push("Link has no readable text");
      if (tag === "input" && !el.labels?.length) errors.push("Input field has no label");

      // ⚠️ SUGGESTIONS
      if (tag === "div" && !el.getAttribute("role")) {
        suggestions.push("Consider using semantic HTML instead of div");
      }

      // 🔥 CHANGE HERE
      const isError = errors.length > 0 || focusable;

      const rect = el.getBoundingClientRect();

      // 🔴 / 🟢 BOX
      const box = document.createElement("div");
      box.className = "a11y-box";

      box.style = `
        position:absolute;
        top:${rect.top + window.scrollY}px;
        left:${rect.left + window.scrollX}px;
        width:${rect.width}px;
        height:${rect.height}px;
        border:3px solid ${isError ? "#ff3b30" : "#00c853"};
        border-radius:4px;
        z-index:999999;
        pointer-events:none;
      `;

      // 🧠 CARD
      const card = document.createElement("div");
      card.className = "a11y-card";

      card.style = `
        position:absolute;
        top:${rect.top + window.scrollY + rect.height + 8}px;
        left:${rect.left + window.scrollX}px;
        background:#1e1e1e;
        color:white;
        font-size:12px;
        padding:12px;
        border-radius:8px;
        box-shadow:0 4px 20px rgba(0,0,0,0.4);
        z-index:1000000;
        width:260px;
        font-family:Arial, sans-serif;
      `;

      card.innerHTML = `
        <div style="font-weight:bold; margin-bottom:6px;">
          ${tag.toUpperCase()}
        </div>

        <div>Role: <b>${role}</b></div>
        <div>Name: <b>${name}</b></div>
        <div>Focusable: ${focusable ? "🔴 Yes" : "🟢 No"}</div>

        <hr style="margin:8px 0; border:0.5px solid #444;">

        ${
          errors.length
            ? `<div style="color:#ff3b30;">❌ ${errors[0]}</div>`
            : focusable
              ? `<div style="color:#ff9800;">⚠ Interactive element</div>`
              : `<div style="color:#00c853;">✅ No issues</div>`
        }

        ${
          suggestions.length
            ? `<div style="color:#ffc107; margin-top:6px;">⚠ ${suggestions[0]}</div>`
            : ""
        }
      `;

      document.body.appendChild(box);
      document.body.appendChild(card);

    }, 120);

  });

})();