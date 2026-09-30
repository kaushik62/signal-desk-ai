export function computeScore(lead, sentFollowUps = 0) {
  const { status, source, last_contacted_at } = lead;

  if (status === 'Converted') return 100;
  if (status === 'Lost') return 0;

  const statusPoints = {
    New: 20,
    Contacted: 35,
    Interested: 60,
  };

  let score = statusPoints[status] || 0;

  // 2. Score based on lead source
  const sourcePoints = {
    Referral: 15,
    LinkedIn: 10,
    Website: 10,
    'Facebook Ads': 5,
    'Cold Email': 3,
    Other: 0,
  };

  score += sourcePoints[source] || 0;

  // 3. Add points based on the last contact
  if (last_contacted_at) {
    const daysSinceContact =
      (Date.now() - new Date(last_contacted_at)) / (1000 * 60 * 60 * 24);

    if (daysSinceContact > 30) {
      score -= 30;
    } else if (daysSinceContact > 14) {
      score -= 15;
    } else if (daysSinceContact <= 3) {
      score += 15;
    } else if (daysSinceContact <= 7) {
      score += 8;
    }
  }

  // 4. Add 2 points for each follow-up (maximum 4 points)
  const validFollowUps = Math.max(0, Number(sentFollowUps) || 0);
  score += Math.min(validFollowUps, 2) * 2;

  // 5. Keep the score between 0 and 100
  return Math.max(0, Math.min(100, score));
}