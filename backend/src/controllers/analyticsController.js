import { getAnalytics, getDashboard, clampDays } from '../services/analyticsService.js';

export const analytics = async (req, res) => res.json(await getAnalytics(req.userId, clampDays(req.query.days)));
export const dashboard = async (req, res) => res.json(await getDashboard(req.userId, clampDays(req.query.days)));
