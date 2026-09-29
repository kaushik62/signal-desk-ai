import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as c from '../controllers/authController.js';

const router = Router();
router.post('/register', c.register);
router.post('/login', c.login);
router.post('/logout', c.logout);
router.get('/me', requireAuth, c.me);
export default router;
