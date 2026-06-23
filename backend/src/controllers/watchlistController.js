import { itemById } from '../data/items.js';
import { addWatchlistItem, deleteWatchlistItem, listWatchlist } from '../models/watchlistModel.js';
import { AppError } from '../utils/AppError.js';

export const getWatchlist = async (request, response) => {
  const data = (await listWatchlist(request.user.id)).map((entry) => ({
    ...entry,
    itemName: itemById.get(entry.itemId)?.name || entry.itemId,
  }));
  response.json({ data });
};

export const createWatchlistItem = async (request, response) => {
  const { itemId, targetProfitPercent = 15, targetNetProfit = 0 } = request.body;
  if (!itemId || !itemById.has(itemId)) throw new AppError('Selecione um item valido.', 400);
  const data = await addWatchlistItem({
    userId: request.user.id,
    itemId,
    targetProfitPercent,
    targetNetProfit,
  });
  response.status(201).json({ data: { ...data, itemName: itemById.get(itemId).name } });
};

export const removeWatchlistItem = async (request, response) => {
  const deleted = await deleteWatchlistItem({ userId: request.user.id, id: request.params.id });
  if (!deleted) throw new AppError('Item da watchlist nao encontrado.', 404);
  response.status(204).send();
};
