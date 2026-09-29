import { Router } from 'express';
import { requireUuidParam } from '../middleware/auth.js';
import * as c from '../controllers/followUpController.js';

const router = Router();
router.get('/', c.list);
router.post('/', c.create);
router.post('/:id/cancel', requireUuidParam, c.cancel);
router.post('/:id/retry', requireUuidParam, c.retry);
export default router;
