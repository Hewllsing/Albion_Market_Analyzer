import { itemById } from '../data/items.js';
import {
  addAnalysisHistory,
  addFavorite,
  addSavedOpportunity,
  deleteFavorite,
  deleteSavedOpportunity,
  getUserDashboard,
  getUserSettings,
  listAnalysisHistory,
  listFavorites,
  listSavedOpportunities,
  updateUserProfile,
  updateUserSettings,
} from '../models/userModel.js';
import { AppError } from '../utils/AppError.js';
import { normalizeEmail } from '../utils/auth.js';
import { parseNumber } from '../utils/query.js';

const allowedPlayerTypes = ['Crafter', 'Refinador', 'Trader', 'Black Market', 'Gatherer', 'PvP Seller'];

export const getDashboard = async (request, response) => {
  response.json({ data: await getUserDashboard(request.user.id) });
};

export const updateProfile = async (request, response) => {
  const name = String(request.body.name || '').trim();
  const email = normalizeEmail(request.body.email);
  if (!name) throw new AppError('Informe o nome.', 400);
  if (!email || !email.includes('@')) throw new AppError('Informe um email valido.', 400);
  const user = await updateUserProfile(request.user.id, { name, email });
  response.json({ data: { user } });
};

export const getSettings = async (request, response) => {
  response.json({ data: await getUserSettings(request.user.id) });
};

export const saveSettings = async (request, response) => {
  const playerType = String(request.body.playerType || 'Trader');
  const data = await updateUserSettings(request.user.id, {
    primaryServer: String(request.body.primaryServer || 'europe'),
    primaryCity: String(request.body.primaryCity || 'Caerleon'),
    language: String(request.body.language || 'pt-BR'),
    currencyServer: String(request.body.currencyServer || request.body.primaryServer || 'europe'),
    marketTaxRate: parseNumber(request.body.marketTaxRate, 0.065, { min: 0, max: 1 }),
    focusReturnRate: parseNumber(request.body.focusReturnRate, 0.479, { min: 0, max: 0.95 }),
    playerType: allowedPlayerTypes.includes(playerType) ? playerType : 'Trader',
    premiumGoalSilver: parseNumber(request.body.premiumGoalSilver, 0, { min: 0 }),
    dailyProfitGoal: parseNumber(request.body.dailyProfitGoal, 0, { min: 0 }),
  });
  response.json({ data });
};

export const getFavorites = async (request, response) => {
  response.json({ data: await listFavorites(request.user.id) });
};

export const createFavorite = async (request, response) => {
  const { itemId } = request.body;
  if (!itemId || !itemById.has(itemId)) throw new AppError('Selecione um item valido.', 400);
  response.status(201).json({ data: await addFavorite({ userId: request.user.id, itemId }) });
};

export const removeFavorite = async (request, response) => {
  const deleted = await deleteFavorite({ userId: request.user.id, id: request.params.id });
  if (!deleted) throw new AppError('Favorito nao encontrado.', 404);
  response.status(204).send();
};

export const getSavedOpportunities = async (request, response) => {
  response.json({ data: await listSavedOpportunities(request.user.id) });
};

export const createSavedOpportunity = async (request, response) => {
  const title = String(request.body.title || '').trim();
  const opportunityType = String(request.body.opportunityType || 'manual');
  if (!title) throw new AppError('Informe um titulo para a oportunidade.', 400);
  const itemId = request.body.itemId || null;
  if (itemId && !itemById.has(itemId)) throw new AppError('Item invalido.', 400);
  const data = await addSavedOpportunity({
    userId: request.user.id,
    opportunityType,
    itemId,
    title,
    payload: request.body.payload,
    targetNetProfit: parseNumber(request.body.targetNetProfit, 0, { min: 0 }),
    targetMarginPercent: parseNumber(request.body.targetMarginPercent, 0, { min: 0 }),
  });
  response.status(201).json({ data });
};

export const removeSavedOpportunity = async (request, response) => {
  const deleted = await deleteSavedOpportunity({ userId: request.user.id, id: request.params.id });
  if (!deleted) throw new AppError('Oportunidade salva nao encontrada.', 404);
  response.status(204).send();
};

export const getAnalysisHistory = async (request, response) => {
  response.json({ data: await listAnalysisHistory(request.user.id, parseNumber(request.query.limit, 20, { min: 1, max: 100 })) });
};

export const createAnalysisHistory = async (request, response) => {
  const analysisType = String(request.body.analysisType || 'manual');
  const summary = String(request.body.summary || '').trim();
  if (!summary) throw new AppError('Informe um resumo da analise.', 400);
  const data = await addAnalysisHistory({
    userId: request.user.id,
    analysisType,
    summary,
    payload: request.body.payload,
  });
  response.status(201).json({ data });
};
