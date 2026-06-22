<script setup>
import { onMounted, reactive, ref } from 'vue';
import EmptyState from '../components/EmptyState.vue';
import ErrorBanner from '../components/ErrorBanner.vue';
import LoadingState from '../components/LoadingState.vue';
import PageHeader from '../components/PageHeader.vue';
import { useRequest } from '../composables/useRequest.js';
import { api } from '../services/api.js';
import { formatPercent, formatSilver } from '../utils/format.js';

const { loading, error, execute } = useRequest();
const entries = ref([]);
const items = ref([]);
const form = reactive({ itemId: '', targetProfitPercent: 15, targetNetProfit: 1000 });

const load = async () => {
  const response = await execute(() => api.getWatchlist());
  if (response) entries.value = response.data;
};

const add = async () => {
  const response = await execute(() => api.addWatchlistItem(form));
  if (!response) return;
  const index = entries.value.findIndex((entry) => entry.itemId === response.data.itemId);
  if (index >= 0) entries.value[index] = response.data;
  else entries.value.unshift(response.data);
};

const remove = async (entry) => {
  const ok = await execute(() => api.removeWatchlistItem(entry.id).then(() => true));
  if (ok) entries.value = entries.value.filter((item) => item.id !== entry.id);
};

onMounted(async () => {
  const catalog = await api.getItems().catch(() => null);
  if (catalog) {
    items.value = catalog.data;
    form.itemId = items.value[0]?.itemId || '';
  }
  load();
});
</script>

<template>
  <div>
    <PageHeader eyebrow="Monitoramento" title="Watchlist" description="Defina os gatilhos que justificam agir, antes de o mercado se mover." />
    <section class="watchlist-layout">
      <form class="panel compact-form" @submit.prevent="add">
        <div class="panel-heading"><div><p class="eyebrow">Novo monitor</p><h2>Adicionar item</h2></div></div>
        <label>Item<select v-model="form.itemId" required><option v-for="item in items" :key="item.itemId" :value="item.itemId">{{ item.name }}</option></select></label>
        <label>Margem alvo (%)<input v-model.number="form.targetProfitPercent" type="number" min="0" step="1" /></label>
        <label>Lucro liquido alvo<input v-model.number="form.targetNetProfit" type="number" min="0" step="500" /></label>
        <button class="button button-primary button-block" :disabled="loading">Salvar monitor</button>
        <p class="form-footnote">A watchlist exige MySQL/MariaDB configurado. Os limiares ficam persistidos para futuros alertas.</p>
      </form>

      <div class="watchlist-content">
        <ErrorBanner v-if="error" :message="error" />
        <LoadingState v-if="loading" label="Carregando seus monitores..." />
        <div v-else-if="entries.length" class="watch-grid">
          <article v-for="entry in entries" :key="entry.id" class="watch-card">
            <div class="watch-card-top"><span class="item-glyph">{{ entry.itemName.slice(0, 2).toUpperCase() }}</span><button type="button" class="icon-button" @click="remove(entry)">Remover</button></div>
            <h2>{{ entry.itemName }}</h2>
            <small>{{ entry.itemId }}</small>
            <div class="watch-targets">
              <div><span>Margem alvo</span><strong>{{ formatPercent(entry.targetProfitPercent) }}</strong></div>
              <div><span>Lucro alvo</span><strong>{{ formatSilver(entry.targetNetProfit) }}</strong></div>
            </div>
            <div class="watch-status"><span class="status-dot idle"></span>Aguardando sinal de mercado</div>
          </article>
        </div>
        <EmptyState v-else title="Sua watchlist esta vazia" message="Adicione itens e defina uma margem que justifique a operacao." />
      </div>
    </section>
  </div>
</template>
