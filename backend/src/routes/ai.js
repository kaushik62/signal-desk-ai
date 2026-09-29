import { Router } from 'express';
import { generate } from '../controllers/aiController.js';

const router = Router();
router.post('/generate-email', generate);
export default router;
