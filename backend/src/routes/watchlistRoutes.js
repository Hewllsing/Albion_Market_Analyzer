import { Router } from 'express';
import {
  createWatchlistItem,
  getWatchlist,
  removeWatchlistItem,
} from '../controllers/watchlistController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(getWatchlist));
router.post('/', asyncHandler(createWatchlistItem));
router.delete('/:id', asyncHandler(removeWatchlistItem));

export default router;
