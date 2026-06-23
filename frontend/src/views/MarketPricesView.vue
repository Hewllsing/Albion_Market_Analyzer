<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
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
const history = ref([]);
const priceMeta = ref({});
const historyMeta = ref({});
const items = ref([]);
const catalog = ref({ categories: [], tiers: [] });
const filters = reactive({
  itemId: '',
  category: 'Recursos refinados',
  tier: 4,
  cities: 'Caerleon',
  qualities: 1,
  minimumPrice: '',
  minimumMargin: '',
  search: '',
});

const availableItems = computed(() => items.value.filter((item) => {
  if (filters.category && item.category !== filters.category) return false;
  if (filters.tier && item.tier !== Number(filters.tier)) return false;
  return true;
}));

const visiblePrices = computed(() => prices.value.filter((price) => {
  const query = filters.search.trim().toLowerCase();
  return !query || `${price.itemName} ${price.itemId}`.toLowerCase().includes(query);
}));

watch(() => [filters.category, filters.tier], () => {
  filters.itemId = '';
});

const loadHistory = async () => {
  const result = await api.getHistory({
    server: settings.server,
    itemId: filters.itemId,
    city: filters.cities,
    category: filters.itemId ? '' : filters.category,
    tier: filters.itemId ? '' : filters.tier,
    limit: 10,
  }).catch(() => ({ data: [], meta: {} }));
  history.value = result.data;
  historyMeta.value = result.meta;
};

const loadPrices = async () => {
  const result = await execute(() => api.getPrices({
    server: settings.server,
    items: filters.itemId,
    category: filters.category,
    tier: filters.tier,
    cities: filters.cities,
    qualities: filters.qualities,
    minimumPrice: filters.minimumPrice,
    minimumMargin: filters.minimumMargin,
  }));
  if (!result) return;
  prices.value = result.data;
  priceMeta.value = result.meta;
  await loadHistory();
};

onMounted(async () => {
  const itemsResult = await api.getItems().catch(() => null);
  if (itemsResult) {
    catalog.value = itemsResult.meta;
    items.value = itemsResult.data;
  }
  loadPrices();
});
</script>

<template>
  <div>
    <PageHeader eyebrow="Cotacoes" title="Precos de mercado" description="Compare ordens, diferencas e atualizacao por cidade.">
      <button class="button button-primary" :disabled="loading" @click="loadPrices">Buscar precos</button>
    </PageHeader>

    <section class="filter-panel filter-panel-prices">
      <label class="filter-item">Item<select v-model="filters.itemId"><option value="">Todos da categoria/tier</option><option v-for="item in availableItems" :key="item.itemId" :value="item.itemId">{{ item.name }}</option></select></label>
      <label>Categoria<select v-model="filters.category"><option v-for="category in catalog.categories" :key="category">{{ category }}</option></select></label>
      <label>Tier<select v-model="filters.tier"><option v-for="tier in catalog.tiers" :key="tier" :value="tier">T{{ tier }}</option></select></label>
      <label>Cidade<select v-model="filters.cities"><option v-for="city in cities" :key="city">{{ city }}</option></select></label>
      <label>Qualidade<select v-model="filters.qualities"><option v-for="quality in 5" :key="quality" :value="quality">{{ qualityName(quality) }}</option></select></label>
      <label>Preco minimo<input v-model.number="filters.minimumPrice" type="number" min="0" step="100" /></label>
      <label>Margem minima (%)<input v-model.number="filters.minimumMargin" type="number" step="1" /></label>
      <label class="filter-search">Filtrar resultado<input v-model="filters.search" type="search" placeholder="Nome ou ID do item" /></label>
    </section>

    <ErrorBanner v-if="error" :message="error" />
    <LoadingState v-if="loading" />
    <article v-else class="panel">
      <div class="panel-heading">
        <div><p class="eyebrow">Resultado</p><h2>{{ visiblePrices.length }} cotacoes</h2></div>
        <span class="data-note">
          {{ priceMeta.rawPriceCount || 0 }} cotacoes brutas - {{ priceMeta.persistence?.saved || 0 }} salvas no historico
        </span>
      </div>
      <ErrorBanner v-if="priceMeta.persistence?.error" :message="`Historico nao gravado: ${priceMeta.persistence.error}`" />
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

    <article class="panel history-panel">
      <div class="panel-heading">
        <div><p class="eyebrow">Banco de dados</p><h2>Historico recente</h2></div>
        <span class="data-note">{{ historyMeta.persistenceConfigured ? 'Persistencia ativa' : 'Configure o banco para ativar' }}</span>
      </div>
      <div v-if="history.length" class="table-wrap">
        <table>
          <thead><tr><th>Item</th><th>Cidade</th><th>Qualidade</th><th>Sell min</th><th>Buy max</th><th>Servidor</th><th>Salvo em</th></tr></thead>
          <tbody>
            <tr v-for="row in history" :key="row.id">
              <td><ItemBadge :name="row.itemName || row.itemId" :tier="row.tier" /></td>
              <td>{{ row.city }}</td>
              <td><span class="quality-badge">{{ qualityName(row.quality) }}</span></td>
              <td>{{ formatSilver(row.sellPriceMin) }}</td>
              <td>{{ formatSilver(row.buyPriceMax) }}</td>
              <td>{{ row.server }}</td>
              <td><span class="date-cell">{{ formatDate(row.createdAt) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <EmptyState v-else title="Ainda sem historico para estes filtros" message="Busque precos com o banco conectado para alimentar a analise futura." />
    </article>
  </div>
</template>
