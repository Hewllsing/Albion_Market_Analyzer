<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import EmptyState from '../components/EmptyState.vue';
import ErrorBanner from '../components/ErrorBanner.vue';
import ItemBadge from '../components/ItemBadge.vue';
import LoadingState from '../components/LoadingState.vue';
import PageHeader from '../components/PageHeader.vue';
import { useMarketSettings } from '../composables/useMarketSettings.js';
import { useRequest } from '../composables/useRequest.js';
import { api } from '../services/api.js';
import { formatDate, formatPercent, formatSilver, qualityName } from '../utils/format.js';

const { settings, cities } = useMarketSettings();
const { loading, error, execute } = useRequest();
const prices = ref([]);
const catalog = ref({ categories: [], tiers: [] });
const filters = reactive({ category: 'Recursos refinados', tier: 4, cities: 'Caerleon', qualities: 1, search: '' });

const visiblePrices = computed(() => prices.value.filter((price) => {
  const query = filters.search.trim().toLowerCase();
  return !query || `${price.itemName} ${price.itemId}`.toLowerCase().includes(query);
}));

const loadPrices = async () => {
  const result = await execute(() => api.getPrices({
    server: settings.server,
    category: filters.category,
    tier: filters.tier,
    cities: filters.cities,
    qualities: filters.qualities,
  }));
  if (result) prices.value = result.data;
};

onMounted(async () => {
  const itemsResult = await api.getItems().catch(() => null);
  if (itemsResult) catalog.value = itemsResult.meta;
  loadPrices();
});
</script>

<template>
  <div>
    <PageHeader eyebrow="Cotacoes" title="Precos de mercado" description="Compare ordens, diferencas e atualizacao por cidade.">
      <button class="button button-primary" :disabled="loading" @click="loadPrices">Buscar precos</button>
    </PageHeader>

    <section class="filter-panel">
      <label>Categoria<select v-model="filters.category"><option v-for="category in catalog.categories" :key="category">{{ category }}</option></select></label>
      <label>Tier<select v-model="filters.tier"><option v-for="tier in catalog.tiers" :key="tier" :value="tier">T{{ tier }}</option></select></label>
      <label>Cidade<select v-model="filters.cities"><option v-for="city in cities" :key="city">{{ city }}</option></select></label>
      <label>Qualidade<select v-model="filters.qualities"><option v-for="quality in 5" :key="quality" :value="quality">{{ qualityName(quality) }}</option></select></label>
      <label class="filter-search">Filtrar resultado<input v-model="filters.search" type="search" placeholder="Nome ou ID do item" /></label>
    </section>

    <ErrorBanner v-if="error" :message="error" />
    <LoadingState v-if="loading" />
    <article v-else class="panel">
      <div class="panel-heading">
        <div><p class="eyebrow">Resultado</p><h2>{{ visiblePrices.length }} cotacoes</h2></div>
        <span class="data-note">Precos em prata por unidade</span>
      </div>
      <div v-if="visiblePrices.length" class="table-wrap">
        <table>
          <thead><tr><th>Item</th><th>Cidade</th><th>Qualidade</th><th>Sell min</th><th>Buy max</th><th>Diferenca</th><th>Margem bruta</th><th>Atualizacao</th></tr></thead>
          <tbody>
            <tr v-for="price in visiblePrices" :key="`${price.itemId}-${price.city}-${price.quality}`">
              <td><ItemBadge :name="price.itemName" :tier="price.tier" /></td>
              <td>{{ price.city }}</td>
              <td><span class="quality-badge">{{ qualityName(price.quality) }}</span></td>
              <td>{{ price.sellPriceMin ? formatSilver(price.sellPriceMin) : 'Sem ordem' }}</td>
              <td>{{ price.buyPriceMax ? formatSilver(price.buyPriceMax) : 'Sem ordem' }}</td>
              <td :class="price.buyPriceMax - price.sellPriceMin > 0 ? 'positive-value' : 'muted-value'">
                {{ formatSilver(price.buyPriceMax - price.sellPriceMin) }}
              </td>
              <td>{{ price.sellPriceMin ? formatPercent(((price.buyPriceMax - price.sellPriceMin) / price.sellPriceMin) * 100) : '-' }}</td>
              <td><span class="date-cell">{{ formatDate(price.sellPriceMinDate || price.buyPriceMaxDate) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <EmptyState v-else title="Sem cotacoes para estes filtros" message="A fonte publica pode nao ter recebido ordens recentes para esta combinacao." />
    </article>
  </div>
</template>
