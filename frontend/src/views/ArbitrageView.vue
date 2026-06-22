<script setup>
import { onMounted, reactive, ref } from 'vue';
import EmptyState from '../components/EmptyState.vue';
import ErrorBanner from '../components/ErrorBanner.vue';
import ItemBadge from '../components/ItemBadge.vue';
import LoadingState from '../components/LoadingState.vue';
import PageHeader from '../components/PageHeader.vue';
import { useMarketSettings } from '../composables/useMarketSettings.js';
import { useRequest } from '../composables/useRequest.js';
import { api } from '../services/api.js';
import { formatDate, formatPercent, formatSilver } from '../utils/format.js';

const { settings, cities } = useMarketSettings();
const { loading, error, execute } = useRequest();
const opportunities = ref([]);
const categories = ref([]);
const filters = reactive({
  originCity: '', destinationCity: '', minimumProfit: 1000, minimumMargin: 5,
  category: '', tier: '', marketTaxPercent: settings.marketTaxPercent,
});

const analyze = async () => {
  const result = await execute(() => api.getArbitrage({
    server: settings.server,
    originCity: filters.originCity,
    destinationCity: filters.destinationCity,
    minimumProfit: filters.minimumProfit,
    minimumMargin: filters.minimumMargin,
    category: filters.category,
    tier: filters.tier,
    qualities: 1,
    marketTaxRate: filters.marketTaxPercent / 100,
    limit: 200,
  }));
  if (result) opportunities.value = result.data;
};

onMounted(async () => {
  const catalog = await api.getItems().catch(() => null);
  if (catalog) categories.value = catalog.meta.categories;
  analyze();
});
</script>

<template>
  <div>
    <PageHeader eyebrow="Rotas comerciais" title="Radar de arbitragem" description="Compre em ordens de venda e liquide em ordens de compra de outra cidade.">
      <button class="button button-primary" :disabled="loading" @click="analyze">Analisar rotas</button>
    </PageHeader>

    <section class="filter-panel filter-panel-wide">
      <label>Origem<select v-model="filters.originCity"><option value="">Todas</option><option v-for="city in cities" :key="city">{{ city }}</option></select></label>
      <label>Destino<select v-model="filters.destinationCity"><option value="">Todas</option><option v-for="city in cities" :key="city">{{ city }}</option></select></label>
      <label>Lucro minimo<input v-model.number="filters.minimumProfit" type="number" min="0" step="500" /></label>
      <label>Margem minima (%)<input v-model.number="filters.minimumMargin" type="number" step="1" /></label>
      <label>Categoria<select v-model="filters.category"><option value="">Todas</option><option v-for="category in categories" :key="category">{{ category }}</option></select></label>
      <label>Tier<select v-model="filters.tier"><option value="">Todos</option><option v-for="tier in [4,5,6,7,8]" :key="tier" :value="tier">T{{ tier }}</option></select></label>
      <label>Taxa mercado (%)<input v-model.number="filters.marketTaxPercent" type="number" min="0" max="100" step="0.1" /></label>
    </section>

    <div class="method-note">
      <strong>Modelo conservador</strong>
      <span>Compra pelo menor sell order e venda imediata pelo maior buy order. Transporte e volume nao estao incluidos.</span>
    </div>
    <ErrorBanner v-if="error" :message="error" />
    <LoadingState v-if="loading" label="Comparando todas as combinacoes de cidades..." />

    <article v-else class="panel">
      <div class="panel-heading">
        <div><p class="eyebrow">Oportunidades validas</p><h2>{{ opportunities.length }} rotas encontradas</h2></div>
        <span class="data-note">Ordenado por lucro liquido</span>
      </div>
      <div v-if="opportunities.length" class="table-wrap">
        <table>
          <thead><tr><th>Item</th><th>Comprar em</th><th>Vender em</th><th>Compra</th><th>Venda</th><th>Taxa</th><th>Lucro liquido</th><th>Margem</th><th>Risco</th><th>Frescor</th></tr></thead>
          <tbody>
            <tr v-for="item in opportunities" :key="`${item.itemId}-${item.purchaseCity}-${item.saleCity}`">
              <td><ItemBadge :name="item.itemName" :tier="item.tier" /></td>
              <td><strong>{{ item.purchaseCity }}</strong></td>
              <td><strong>{{ item.saleCity }}</strong></td>
              <td>{{ formatSilver(item.purchasePrice) }}</td>
              <td>{{ formatSilver(item.salePrice) }}</td>
              <td class="muted-value">-{{ formatSilver(item.estimatedTax) }}</td>
              <td class="positive-value">+{{ formatSilver(item.netProfit) }}</td>
              <td>{{ formatPercent(item.marginPercent) }}</td>
              <td><span class="risk-badge" :class="item.risk.level.toLowerCase()">{{ item.risk.level }}</span></td>
              <td><span class="date-cell">{{ formatDate(item.saleUpdatedAt) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <EmptyState v-else title="Nenhuma rota passou pelos limites" message="Reduza lucro ou margem minima, ou deixe origem e destino em Todas." />
    </article>
  </div>
</template>
