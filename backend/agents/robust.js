const axios = require("axios");

async function runRobust(html) {
  try {
    const res = await axios.post(
      "https://validator.w3.org/nu/?out=json",
      html,
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8"
        }
      }
    );

    return res.data.messages.slice(0, 10); // limit output

  } catch (err) {
    return "Validation failed";
  }
}

module.exports = runRobust;