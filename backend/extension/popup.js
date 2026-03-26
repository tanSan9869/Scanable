const run = async (file) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: [file]
  });
};

document.getElementById("hover").onclick = () => run("hover.js");
document.getElementById("scan").onclick = () => run("scan.js");
document.getElementById("clear").onclick = () => run("clear.js");
document.getElementById("game").onclick = () => run("game.js");