import { createRouter, createWebHistory } from 'vue-router';
import ArbitrageView from '../views/ArbitrageView.vue';
import CraftingView from '../views/CraftingView.vue';
import DashboardView from '../views/DashboardView.vue';
import MarketPricesView from '../views/MarketPricesView.vue';
import RankingsView from '../views/RankingsView.vue';

const routes = [
  { path: '/', name: 'dashboard', component: DashboardView, meta: { title: 'Dashboard' } },
  { path: '/prices', name: 'prices', component: MarketPricesView, meta: { title: 'Precos de mercado' } },
  { path: '/arbitrage', name: 'arbitrage', component: ArbitrageView, meta: { title: 'Arbitragem' } },
  { path: '/crafting', name: 'crafting', component: CraftingView, meta: { title: 'Lucro de crafting' } },
  { path: '/rankings', name: 'rankings', component: RankingsView, meta: { title: 'Rankings' } },
];

const router = createRouter({ history: createWebHistory(), routes });
router.afterEach((route) => { document.title = `${route.meta.title} | Albion Market Analyzer`; });

export default router;
