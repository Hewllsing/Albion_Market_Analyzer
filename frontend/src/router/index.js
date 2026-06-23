import { createRouter, createWebHistory } from 'vue-router';
import ArbitrageView from '../views/ArbitrageView.vue';
import AuthView from '../views/AuthView.vue';
import CraftingView from '../views/CraftingView.vue';
import DashboardView from '../views/DashboardView.vue';
import MarketPricesView from '../views/MarketPricesView.vue';
import ProfileView from '../views/ProfileView.vue';
import RankingsView from '../views/RankingsView.vue';
import UserDashboardView from '../views/UserDashboardView.vue';
import WatchlistView from '../views/WatchlistView.vue';
import { getAuthToken } from '../services/api.js';

const routes = [
  { path: '/', name: 'dashboard', component: DashboardView, meta: { title: 'Dashboard' } },
  { path: '/login', name: 'login', component: AuthView, meta: { title: 'Entrar' } },
  { path: '/my', name: 'my-dashboard', component: UserDashboardView, meta: { title: 'Meu dashboard', requiresAuth: true } },
  { path: '/profile', name: 'profile', component: ProfileView, meta: { title: 'Perfil', requiresAuth: true } },
  { path: '/prices', name: 'prices', component: MarketPricesView, meta: { title: 'Precos de mercado' } },
  { path: '/arbitrage', name: 'arbitrage', component: ArbitrageView, meta: { title: 'Arbitragem' } },
  { path: '/crafting', name: 'crafting', component: CraftingView, meta: { title: 'Lucro de crafting' } },
  { path: '/rankings', name: 'rankings', component: RankingsView, meta: { title: 'Rankings' } },
  { path: '/watchlist', name: 'watchlist', component: WatchlistView, meta: { title: 'Watchlist', requiresAuth: true } },
];

const router = createRouter({ history: createWebHistory(), routes });
router.beforeEach((route) => {
  const authenticated = Boolean(getAuthToken());
  if (route.meta.requiresAuth && !authenticated) return { name: 'login', query: { redirect: route.fullPath } };
  if (route.name === 'login' && authenticated) return { name: 'my-dashboard' };
  return true;
});
router.afterEach((route) => { document.title = `${route.meta.title} | Albion Market Analyzer`; });

export default router;
