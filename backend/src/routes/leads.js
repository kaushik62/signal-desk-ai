import { Router } from 'express';
import { requireUuidParam } from '../middleware/auth.js';
import * as c from '../controllers/leadController.js';

const router = Router();
router.get('/', c.list);
router.post('/', c.create);
router.get('/:id', requireUuidParam, c.detail);
router.put('/:id', requireUuidParam, c.update);
router.delete('/:id', requireUuidParam, c.remove);
export default router;
