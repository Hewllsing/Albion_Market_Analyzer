import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
});

let authToken = localStorage.getItem('ama:token') || '';

export const setAuthToken = (token) => {
  authToken = token || '';
  if (authToken) localStorage.setItem('ama:token', authToken);
  else localStorage.removeItem('ama:token');
};

export const getAuthToken = () => authToken;

client.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

const cleanParams = (params) => Object.fromEntries(
  Object.entries(params || {}).filter(([, value]) => value !== '' && value !== undefined && value !== null),
);

export const api = {
  register: (payload) => client.post('/auth/register', payload).then(({ data }) => data),
  login: (payload) => client.post('/auth/login', payload).then(({ data }) => data),
  getMe: () => client.get('/auth/me').then(({ data }) => data),
  requestPasswordReset: (payload) => client.post('/auth/password-reset/request', payload).then(({ data }) => data),
  confirmPasswordReset: (payload) => client.post('/auth/password-reset/confirm', payload).then(({ data }) => data),
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
  getUserDashboard: () => client.get('/user/dashboard').then(({ data }) => data),
  updateProfile: (payload) => client.patch('/user/profile', payload).then(({ data }) => data),
  getUserSettings: () => client.get('/user/settings').then(({ data }) => data),
  updateUserSettings: (payload) => client.patch('/user/settings', payload).then(({ data }) => data),
  getFavorites: () => client.get('/user/favorites').then(({ data }) => data),
  addFavorite: (payload) => client.post('/user/favorites', payload).then(({ data }) => data),
  removeFavorite: (id) => client.delete(`/user/favorites/${id}`),
  getSavedOpportunities: () => client.get('/user/opportunities').then(({ data }) => data),
  addSavedOpportunity: (payload) => client.post('/user/opportunities', payload).then(({ data }) => data),
  removeSavedOpportunity: (id) => client.delete(`/user/opportunities/${id}`),
  getAnalysisHistory: (params) => client.get('/user/history', { params: cleanParams(params) }).then(({ data }) => data),
  addAnalysisHistory: (payload) => client.post('/user/history', payload).then(({ data }) => data),
};
