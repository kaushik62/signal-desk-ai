import { Router } from 'express';
import { analytics, dashboard } from '../controllers/analyticsController.js';

const router = Router();
router.get('/', analytics);
router.get('/dashboard', dashboard);
export default router;
