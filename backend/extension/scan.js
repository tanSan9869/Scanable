(async () => {

  alert("🚀 Full Accessibility Scan Running");

  document.querySelectorAll(".a11y-box, .a11y-label").forEach(el => el.remove());

  const script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js";
  document.head.appendChild(script);

  await new Promise(r => script.onload = r);

  const results = await axe.run();

  let count = 0;

  results.violations.forEach(v => {
    v.nodes.forEach(node => {

      const el = document.querySelector(node.target[0]);
      if (!el) return;

      count++;

      const rect = el.getBoundingClientRect();

      const box = document.createElement("div");
      box.className = "a11y-box";

      box.style = `
        position:absolute;
        top:${rect.top + window.scrollY}px;
        left:${rect.left + window.scrollX}px;
        width:${rect.width}px;
        height:${rect.height}px;
        border:3px solid red;
        z-index:999999;
        pointer-events:none;
      `;

      const label = document.createElement("div");
      label.className = "a11y-label";
      label.innerText = v.id;

      label.style = `
        position:absolute;
        top:${rect.top + window.scrollY - 20}px;
        left:${rect.left + window.scrollX}px;
        background:red;
        color:white;
        font-size:10px;
        padding:2px 5px;
        z-index:1000000;
      `;

      document.body.appendChild(box);
      document.body.appendChild(label);

    });
  });

  alert(`❌ ${count} issues found`);

})();