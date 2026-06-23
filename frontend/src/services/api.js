import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
});

const cleanParams = (params) => Object.fromEntries(
  Object.entries(params || {}).filter(([, value]) => value !== '' && value !== undefined && value !== null),
);

export const api = {
  getItems: (params) => client.get('/items', { params: cleanParams(params) }).then(({ data }) => data),
  getPrices: (params) => client.get('/market/prices', { params: cleanParams(params) }).then(({ data }) => data),
  getArbitrage: (params) => client.get('/market/arbitrage', { params: cleanParams(params) }).then(({ data }) => data),
  getCraftingProfit: (params) => client.get('/market/crafting-profit', { params: cleanParams(params) }).then(({ data }) => data),
  getRefiningProfit: (params) => client.get('/market/refining-profit', { params: cleanParams(params) }).then(({ data }) => data),
  getRankings: (params) => client.get('/market/rankings', { params: cleanParams(params) }).then(({ data }) => data),
  getHistory: (params) => client.get('/market/history', { params: cleanParams(params) }).then(({ data }) => data),
  getWatchlist: () => client.get('/watchlist').then(({ data }) => data),
  addWatchlistItem: (payload) => client.post('/watchlist', payload).then(({ data }) => data),
  removeWatchlistItem: (id) => client.delete(`/watchlist/${id}`),
};
