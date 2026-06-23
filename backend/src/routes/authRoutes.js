import { Router } from 'express';
import {
  confirmPasswordReset,
  getMe,
  login,
  register,
  requestPasswordReset,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', requireAuth, asyncHandler(getMe));
router.post('/password-reset/request', asyncHandler(requestPasswordReset));
router.post('/password-reset/confirm', asyncHandler(confirmPasswordReset));

export default router;
