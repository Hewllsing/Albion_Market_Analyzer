<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import EmptyState from '../components/EmptyState.vue';
import ErrorBanner from '../components/ErrorBanner.vue';
import LoadingState from '../components/LoadingState.vue';
import PageHeader from '../components/PageHeader.vue';
import { useMarketSettings } from '../composables/useMarketSettings.js';
import { useRequest } from '../composables/useRequest.js';
import { api } from '../services/api.js';
import { formatPercent, formatSilver } from '../utils/format.js';

const { settings, cities } = useMarketSettings();
const { loading, error, execute } = useRequest();
const items = ref([]);
const result = ref(null);
const form = reactive({
  itemId: '', materialCity: 'Caerleon', craftCity: 'Caerleon', saleCity: 'Caerleon',
  quantity: 1, stationFeePercent: 0, resourceReturnPercent: 0, marketTaxPercent: settings.marketTaxPercent,
  useFocus: false,
});

const recommendationTone = computed(() => ({
  Craftar: 'positive', Aguardar: 'warning', 'Nao vale a pena': 'negative',
}[result.value?.recommendation] || 'neutral'));

const calculate = async () => {
  if (!form.itemId) return;
  const response = await execute(() => api.getCraftingProfit({
    server: settings.server,
    itemId: form.itemId,
    materialCity: form.materialCity,
    craftCity: form.craftCity,
    saleCity: form.saleCity,
    quantity: form.quantity,
    stationFeeRate: form.stationFeePercent / 100,
    resourceReturnRate: form.resourceReturnPercent / 100,
    marketTaxRate: form.marketTaxPercent / 100,
    useFocus: form.useFocus,
  }));
  if (response) result.value = response.data;
};

onMounted(async () => {
  const response = await api.getItems().catch(() => null);
  if (!response) return;
  items.value = response.data.filter((item) => ['Armas', 'Armaduras'].includes(item.category) && item.tier <= 6);
});
</script>

<template>
  <div>
    <PageHeader eyebrow="Simulador" title="Lucro de crafting" description="Modele custo efetivo, retorno de recursos e liquidacao da producao." />
    <div class="craft-layout">
      <form class="panel craft-form" @submit.prevent="calculate">
        <div class="panel-heading"><div><p class="eyebrow">Premissas</p><h2>Configurar operacao</h2></div></div>
        <label class="field-full">Item final<select v-model="form.itemId" required><option disabled value="">Selecione</option><option v-for="item in items" :key="item.itemId" :value="item.itemId">{{ item.name }}</option></select></label>
        <div class="form-grid">
          <label>Comprar materiais em<select v-model="form.materialCity"><option v-for="city in cities" :key="city">{{ city }}</option></select></label>
          <label>Cidade de craft<select v-model="form.craftCity"><option v-for="city in cities" :key="city">{{ city }}</option></select></label>
          <label>Vender em<select v-model="form.saleCity"><option v-for="city in cities" :key="city">{{ city }}</option></select></label>
          <label>Quantidade<input v-model.number="form.quantity" type="number" min="1" max="100000" /></label>
          <label>Taxa da estacao (%)<input v-model.number="form.stationFeePercent" type="number" min="0" max="100" step="0.1" /></label>
          <label>Retorno de recursos (%)<input v-model.number="form.resourceReturnPercent" type="number" min="0" max="95" step="0.1" :disabled="form.useFocus" /></label>
          <label>Taxa de mercado (%)<input v-model.number="form.marketTaxPercent" type="number" min="0" max="100" step="0.1" /></label>
          <label class="toggle-field"><input v-model="form.useFocus" type="checkbox" /><span><strong>Usar Focus</strong><small>Aplica 47,9% se o retorno estiver zerado</small></span></label>
        </div>
        <button class="button button-primary button-block" :disabled="loading || !form.itemId">Calcular viabilidade</button>
        <p class="form-footnote">O custo da estacao e aproximado como percentual do custo efetivo dos materiais.</p>
      </form>

      <section class="craft-result">
        <ErrorBanner v-if="error" :message="error" />
        <LoadingState v-if="loading" label="Precificando materiais e produto..." />
        <template v-else-if="result">
          <article class="recommendation-card" :class="`recommendation-${recommendationTone}`">
            <p class="eyebrow">Recomendacao</p>
            <h2>{{ result.recommendation }}</h2>
            <p>{{ result.itemName }} · {{ result.quantity }} unidade(s)</p>
            <div><strong>{{ formatSilver(result.netProfit) }}</strong><span>lucro liquido total</span></div>
          </article>
          <article class="panel breakdown-panel">
            <div class="panel-heading"><div><p class="eyebrow">Economia da operacao</p><h2>Detalhamento</h2></div><strong class="margin-highlight">{{ formatPercent(result.marginPercent) }}</strong></div>
            <dl class="breakdown-list">
              <div><dt>Materiais apos retorno</dt><dd>{{ formatSilver(result.materialCost) }}</dd></div>
              <div><dt>Taxa da estacao</dt><dd>{{ formatSilver(result.stationFee) }}</dd></div>
              <div class="total-line"><dt>Custo total</dt><dd>{{ formatSilver(result.totalCost) }}</dd></div>
              <div><dt>Receita de venda</dt><dd>{{ formatSilver(result.saleRevenue) }}</dd></div>
              <div><dt>Taxa de mercado</dt><dd>-{{ formatSilver(result.marketTax) }}</dd></div>
              <div class="profit-line"><dt>Lucro por unidade</dt><dd :class="{ 'negative-value': result.profitPerUnit < 0 }">{{ result.profitPerUnit >= 0 ? '+' : '' }}{{ formatSilver(result.profitPerUnit) }}</dd></div>
              <div class="profit-line"><dt>Lucro por 100</dt><dd :class="{ 'negative-value': result.profitPer100 < 0 }">{{ result.profitPer100 >= 0 ? '+' : '' }}{{ formatSilver(result.profitPer100) }}</dd></div>
            </dl>
          </article>
          <article class="panel materials-panel">
            <div class="panel-heading"><div><p class="eyebrow">Entrada</p><h2>Materiais</h2></div></div>
            <div v-for="material in result.materials" :key="material.itemId" class="material-row">
              <span>{{ material.itemName }}</span><span>{{ material.quantity }} × {{ formatSilver(material.unitPrice) }}</span>
            </div>
          </article>
        </template>
        <EmptyState v-else title="Simulador pronto" message="Selecione um item e informe suas condicoes reais de crafting." />
      </section>
    </div>
  </div>
</template>
