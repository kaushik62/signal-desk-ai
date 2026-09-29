const STATUS_POINTS = { New: 20, Contacted: 35, Interested: 60, Converted: 100, Lost: 0 };
const SOURCE_POINTS = { Referral: 15, LinkedIn: 10, Website: 10, 'Facebook Ads': 5, 'Cold Email': 3, Other: 0 };

export function computeScore({ status, source, last_contacted_at }, sentFollowUps = 0) {
  if (status === 'Converted') return 100;
  if (status === 'Lost') return 0;

  let score = STATUS_POINTS[status] ?? 0;
  score += SOURCE_POINTS[source] ?? 0;

  if (last_contacted_at) {
    const days = (Date.now() - new Date(last_contacted_at)) / 86400000;
    score += days <= 3 ? 15 : days <= 7 ? 8 : days > 14 ? -10 : 0;
  }
  score += Math.min(sentFollowUps, 2) * 5;

  return Math.max(0, Math.min(100, score));
}
