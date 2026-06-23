import { Router } from 'express';
import {
  createAnalysisHistory,
  createFavorite,
  createSavedOpportunity,
  getAnalysisHistory,
  getDashboard,
  getFavorites,
  getSavedOpportunities,
  getSettings,
  removeFavorite,
  removeSavedOpportunity,
  saveSettings,
  updateProfile,
} from '../controllers/userController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth);

router.get('/dashboard', asyncHandler(getDashboard));
router.patch('/profile', asyncHandler(updateProfile));
router.get('/settings', asyncHandler(getSettings));
router.patch('/settings', asyncHandler(saveSettings));
router.get('/favorites', asyncHandler(getFavorites));
router.post('/favorites', asyncHandler(createFavorite));
router.delete('/favorites/:id', asyncHandler(removeFavorite));
router.get('/opportunities', asyncHandler(getSavedOpportunities));
router.post('/opportunities', asyncHandler(createSavedOpportunity));
router.delete('/opportunities/:id', asyncHandler(removeSavedOpportunity));
router.get('/history', asyncHandler(getAnalysisHistory));
router.post('/history', asyncHandler(createAnalysisHistory));

export default router;
