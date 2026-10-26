import { Router } from 'express';
import health from './health.js';
import auth from './auth.js';
import admin from './admin.js';
import items from './items.js';
import meta from './meta.js';

const router = Router();

router.use('/health', health);
router.use('/auth', auth);
router.use('/admin', admin);
router.use('/items', items);
router.use('/', meta);

export default router;
