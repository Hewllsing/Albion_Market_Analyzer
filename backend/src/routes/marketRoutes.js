import { Router } from 'express';
import {
  getArbitrage,
  getCraftingProfit,
  getHistory,
  getPrices,
  getRankings,
  getRefiningProfit,
} from '../controllers/marketController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/prices', asyncHandler(getPrices));
router.get('/arbitrage', asyncHandler(getArbitrage));
router.get('/crafting-profit', asyncHandler(getCraftingProfit));
router.get('/refining-profit', asyncHandler(getRefiningProfit));
router.get('/rankings', asyncHandler(getRankings));
router.get('/history', asyncHandler(getHistory));

export default router;
