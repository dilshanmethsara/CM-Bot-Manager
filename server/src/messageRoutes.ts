import { Router } from 'express';
import * as ctrl from './messageController.js';
import { authMiddleware } from './middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

router.post('/text', ctrl.sendTextMessage);
router.post('/image', ctrl.uploadImage, ctrl.sendImageMessage);
router.post('/document', ctrl.uploadDocument, ctrl.sendDocumentMessage);
router.post('/media', ctrl.uploadMedia, ctrl.sendMediaMessage);

export default router;
