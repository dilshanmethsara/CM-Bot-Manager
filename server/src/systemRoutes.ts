import { Router } from 'express';
import * as ctrl from './systemController.js';
import { authMiddleware } from './middlewares/auth.js';

const router = Router();

// ── Auth endpoints (public) ───────────────────────────────────────────────
router.post('/auth/login', ctrl.login);
router.post('/auth/logout', ctrl.logout);
router.get('/auth/check', ctrl.checkAuth);
router.post('/auth/password', authMiddleware, ctrl.changePassword);

// ── System (protected) ────────────────────────────────────────────────────
router.get('/health', ctrl.getHealth);
router.get('/stats', authMiddleware, ctrl.getStats);
router.get('/logs', authMiddleware, ctrl.getLogs);
router.get('/messages/history', authMiddleware, ctrl.getMessageHistory);
router.get('/requests', authMiddleware, ctrl.getApiRequests);
router.get('/rate-limits', authMiddleware, ctrl.getRateLimits);
router.get('/api-keys', authMiddleware, ctrl.getApiKeys);
router.post('/api-keys', authMiddleware, ctrl.createApiKey);
router.delete('/api-keys/:id', authMiddleware, ctrl.deleteApiKey);

// ── Dashboard chart data (protected) ────────────────────────────────────────
router.get('/messages/trends', authMiddleware, ctrl.getMessageTrends);
router.get('/messages/delivery-stats', authMiddleware, ctrl.getDeliveryStats);
router.get('/api-usage', authMiddleware, ctrl.getApiUsage);

export default router;
