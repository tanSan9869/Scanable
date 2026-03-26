function calculateScore(violations) {
  let score = 100;

  violations.forEach(v => {
    if (v.impact === "critical") score -= 10;
    else if (v.impact === "serious") score -= 7;
    else if (v.impact === "moderate") score -= 4;
    else score -= 1;
  });

  return Math.max(score, 0);
}

module.exports = calculateScore;