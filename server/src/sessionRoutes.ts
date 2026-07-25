import { Router } from 'express';
import * as ctrl from './sessionController.js';
import { authMiddleware } from './middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', ctrl.getAllSessions);
router.post('/', ctrl.createSession);
router.delete('/:id', ctrl.deleteSession);
router.post('/:id/connect', ctrl.connectSession);
router.post('/:id/disconnect', ctrl.disconnectSession);
router.post('/:id/restart', ctrl.restartSession);
router.patch('/:id', ctrl.updateSession);
router.get('/:id/qr', ctrl.getSessionQR);
router.get('/:id/pairing-code', ctrl.getSessionPairingCode);
router.get('/:id/status', ctrl.getSessionStatus);

export default router;
