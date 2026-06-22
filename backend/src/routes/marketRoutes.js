import { Router } from 'express';
import { getArbitrage, getCraftingProfit, getHistory, getPrices } from '../controllers/marketController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/prices', asyncHandler(getPrices));
router.get('/arbitrage', asyncHandler(getArbitrage));
router.get('/crafting-profit', asyncHandler(getCraftingProfit));
router.get('/history', asyncHandler(getHistory));

export default router;
