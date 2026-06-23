<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
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
const activeGroup = ref('food');
const itemSearch = ref('');
const manualMaterialPrices = reactive({});
const form = reactive({
  itemId: '',
  materialCity: 'Caerleon',
  craftCity: 'Caerleon',
  saleCity: 'Caerleon',
  quantity: 1,
  stationFeePercent: 0,
  resourceReturnPercent: 0,
  focusReturnPercent: 47.9,
  marketTaxPercent: settings.marketTaxPercent,
  salePrice: '',
  useFocus: false,
});

const craftGroups = [
  { key: 'food', label: 'Comidas', helper: 'Ensopados, sanduiches e omeletes', categories: ['Comidas'] },
  { key: 'potions', label: 'Pocoes', helper: 'Cura, energia e resistencia', categories: ['Pocoes'] },
  { key: 'equipment', label: 'Equipamentos', helper: 'Armas e armaduras', categories: ['Armas', 'Armaduras'] },
];

const activeGroupConfig = computed(() => craftGroups.find((group) => group.key === activeGroup.value));
const groupItems = computed(() => items.value.filter((item) => activeGroupConfig.value?.categories.includes(item.category)));
const filteredItems = computed(() => {
  const search = itemSearch.value.trim().toLowerCase();
  if (!search) return groupItems.value;
  return groupItems.value.filter((item) => `${item.name} ${item.itemId}`.toLowerCase().includes(search));
});
const selectedScenario = computed(() => {
  if (!result.value?.focusComparison) return null;
  return form.useFocus ? result.value.focusComparison.withFocus : result.value.focusComparison.withoutFocus;
});
const comparisonScenarios = computed(() => {
  if (!result.value?.focusComparison) return [];
  return [result.value.focusComparison.withoutFocus, result.value.focusComparison.withFocus];
});
const recommendationTone = computed(() => {
  const recommendation = selectedScenario.value?.recommendation;
  return ({
    Craftar: 'positive',
    Aguardar: 'warning',
    'Completar precos': 'warning',
    'Nao vale a pena': 'negative',
  }[recommendation] || 'neutral');
});

const formatQuantity = (value) => new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
}).format(Number(value || 0));

const scenarioTone = (scenario) => {
  if (scenario.recommendation === 'Completar precos') return 'warning';
  return scenario.netProfit >= 0 ? 'positive' : 'negative';
};

const materialPriceLabel = (material) => {
  if (material.missingPrice) return 'sem cotacao';
  return material.priceSource === 'manual' ? 'preco manual' : 'preco de mercado';
};

const resetManualPrices = () => {
  Object.keys(manualMaterialPrices).forEach((key) => { delete manualMaterialPrices[key]; });
};

const ensureSelectedItem = () => {
  if (!filteredItems.value.length) {
    form.itemId = '';
    return;
  }
  if (!filteredItems.value.some((item) => item.itemId === form.itemId)) {
    form.itemId = filteredItems.value[0].itemId;
  }
};

watch(activeGroup, () => {
  result.value = null;
  itemSearch.value = '';
  form.salePrice = '';
  resetManualPrices();
  ensureSelectedItem();
});

watch(items, ensureSelectedItem);
watch(itemSearch, ensureSelectedItem);

watch(() => form.itemId, () => {
  result.value = null;
  form.salePrice = '';
  resetManualPrices();
});

const collectManualMaterialPrices = () => Object.fromEntries(
  Object.entries(manualMaterialPrices)
    .map(([itemId, value]) => [itemId, Number(value)])
    .filter(([, value]) => Number.isFinite(value) && value > 0),
);

const hydrateMissingManualInputs = () => {
  result.value?.missingMaterials?.forEach((material) => {
    if (manualMaterialPrices[material.itemId] === undefined) manualMaterialPrices[material.itemId] = '';
  });
};

const calculate = async () => {
  if (!form.itemId) return;
  const materialPrices = collectManualMaterialPrices();
  const response = await execute(() => api.getCraftingProfit({
    server: settings.server,
    craftGroup: activeGroup.value,
    itemId: form.itemId,
    materialCity: form.materialCity,
    craftCity: form.craftCity,
    saleCity: form.saleCity,
    quantity: form.quantity,
    stationFeeRate: form.stationFeePercent / 100,
    resourceReturnRate: form.resourceReturnPercent / 100,
    focusReturnRate: form.focusReturnPercent / 100,
    marketTaxRate: form.marketTaxPercent / 100,
    salePrice: form.salePrice,
    materialPrices: Object.keys(materialPrices).length ? JSON.stringify(materialPrices) : '',
    useFocus: form.useFocus,
  }));
  if (response) {
    result.value = response.data;
    hydrateMissingManualInputs();
  }
};

onMounted(async () => {
  const response = await api.getItems({ scope: 'crafting' }).catch(() => null);
  if (!response) return;
  items.value = response.data.filter((item) => craftGroups.some((group) => group.categories.includes(item.category)));
  ensureSelectedItem();
});
</script>

<template>
  <div>
    <PageHeader eyebrow="Simulador" title="Lucro de crafting" description="Compare comidas, pocoes e equipamentos com custo de materiais, taxa de venda e margem liquida sem/com Focus." />
    <div class="craft-layout">
      <form class="panel craft-form" @submit.prevent="calculate">
        <div class="panel-heading"><div><p class="eyebrow">Categoria</p><h2>Escolher craft</h2></div></div>
        <div class="craft-tabs">
          <button v-for="group in craftGroups" :key="group.key" type="button" :class="{ active: activeGroup === group.key }" @click="activeGroup = group.key">
            <strong>{{ group.label }}</strong>
            <small>{{ group.helper }}</small>
          </button>
        </div>

        <label class="field-full">Buscar item<input v-model="itemSearch" placeholder="Nome ou ID do item" /></label>
        <label class="field-full">Item final<select v-model="form.itemId" required><option disabled value="">Selecione</option><option v-for="item in filteredItems" :key="item.itemId" :value="item.itemId">{{ item.name }} ({{ item.itemId }})</option></select></label>
        <p class="form-footnote">{{ filteredItems.length }} item(ns) nesta selecao.</p>
        <div class="form-grid">
          <label>Comprar materiais em<select v-model="form.materialCity"><option v-for="city in cities" :key="city">{{ city }}</option></select></label>
          <label>Cidade de craft<select v-model="form.craftCity"><option v-for="city in cities" :key="city">{{ city }}</option></select></label>
          <label>Vender em<select v-model="form.saleCity"><option v-for="city in cities" :key="city">{{ city }}</option></select></label>
          <label>Quantidade<input v-model.number="form.quantity" type="number" min="1" max="100000" /></label>
          <label>Taxa da estacao (%)<input v-model.number="form.stationFeePercent" type="number" min="0" max="100" step="0.1" /></label>
          <label>Retorno sem Focus (%)<input v-model.number="form.resourceReturnPercent" type="number" min="0" max="95" step="0.1" /></label>
          <label>Retorno com Focus (%)<input v-model.number="form.focusReturnPercent" type="number" min="0" max="95" step="0.1" /></label>
          <label>Taxa de mercado (%)<input v-model.number="form.marketTaxPercent" type="number" min="0" max="100" step="0.1" /></label>
          <label>Preco venda manual<input v-model.number="form.salePrice" type="number" min="0" step="1" placeholder="Opcional" /></label>
          <label class="toggle-field"><input v-model="form.useFocus" type="checkbox" /><span><strong>Cenario principal com Focus</strong><small>A comparacao sempre mostra os dois</small></span></label>
        </div>
        <button class="button button-primary button-block" :disabled="loading || !form.itemId">Calcular viabilidade</button>
        <p class="form-footnote">Se a API nao trouxer algum ingrediente, informe o preco manual e recalcule. Focus usa o retorno informado no campo "Retorno com Focus".</p>
      </form>

      <section class="craft-result">
        <ErrorBanner v-if="error" :message="error" />
        <LoadingState v-if="loading" label="Precificando materiais e produto..." />
        <template v-else-if="result && selectedScenario">
          <article v-if="result.hasMissingPrices" class="panel missing-price-panel">
            <div class="panel-heading"><div><p class="eyebrow">Precos incompletos</p><h2>Complete as cotacoes</h2></div></div>
            <p>A API nao trouxe todas as cotacoes para esta cidade. Os campos abaixo entram no calculo como preco manual.</p>
            <div v-if="result.missingSalePrice" class="form-grid">
              <label>Preco de venda do item<input v-model.number="form.salePrice" type="number" min="0" step="1" /></label>
            </div>
            <div v-if="result.missingMaterials.length" class="form-grid">
              <label v-for="material in result.missingMaterials" :key="material.itemId">{{ material.itemName }}<input v-model.number="manualMaterialPrices[material.itemId]" type="number" min="0" step="1" /></label>
            </div>
            <button type="button" class="button button-primary button-block" :disabled="loading" @click="calculate">Recalcular com precos manuais</button>
          </article>

          <article class="recommendation-card" :class="`recommendation-${recommendationTone}`">
            <p class="eyebrow">Cenario principal</p>
            <h2>{{ selectedScenario.recommendation }}</h2>
            <p>{{ result.itemName }} - {{ result.quantity }} unidade(s) - {{ selectedScenario.label }}</p>
            <div><strong>{{ formatSilver(selectedScenario.netProfit) }}</strong><span>lucro liquido total</span></div>
          </article>

          <div class="scenario-grid">
            <article v-for="scenario in comparisonScenarios" :key="scenario.label" class="panel scenario-card" :class="`scenario-${scenarioTone(scenario)}`">
              <p class="eyebrow">{{ scenario.label }}</p>
              <h2>{{ formatSilver(scenario.netProfit) }}</h2>
              <dl class="breakdown-list">
                <div><dt>Margem liquida</dt><dd>{{ formatPercent(scenario.marginPercent) }}</dd></div>
                <div><dt>Retorno aplicado</dt><dd>{{ formatPercent(scenario.resourceReturnRate * 100) }}</dd></div>
                <div><dt>Custo materiais</dt><dd>{{ formatSilver(scenario.materialCost) }}</dd></div>
                <div><dt>Taxa para vender</dt><dd>-{{ formatSilver(scenario.marketTax) }}</dd></div>
              </dl>
            </article>
          </div>

          <article class="panel breakdown-panel">
            <div class="panel-heading"><div><p class="eyebrow">Economia da operacao</p><h2>Detalhamento</h2></div><strong class="margin-highlight">{{ formatPercent(selectedScenario.marginPercent) }}</strong></div>
            <dl class="breakdown-list">
              <div><dt>Materiais antes do retorno</dt><dd>{{ formatSilver(selectedScenario.materialGrossCost) }}</dd></div>
              <div><dt>Materiais apos retorno</dt><dd>{{ formatSilver(selectedScenario.materialCost) }}</dd></div>
              <div><dt>Taxa da estacao</dt><dd>{{ formatSilver(selectedScenario.stationFee) }}</dd></div>
              <div class="total-line"><dt>Custo total para craftar</dt><dd>{{ formatSilver(selectedScenario.totalCost) }}</dd></div>
              <div><dt>Preco competitivo unitario</dt><dd>{{ formatSilver(result.salePrice) }}</dd></div>
              <div><dt>Receita bruta de venda</dt><dd>{{ formatSilver(selectedScenario.saleRevenue) }}</dd></div>
              <div><dt>Custo para vender</dt><dd>-{{ formatSilver(selectedScenario.marketTax) }}</dd></div>
              <div><dt>Receita liquida de venda</dt><dd>{{ formatSilver(selectedScenario.netSaleRevenue) }}</dd></div>
              <div class="profit-line"><dt>Lucro por unidade</dt><dd :class="{ 'negative-value': selectedScenario.profitPerUnit < 0 }">{{ selectedScenario.profitPerUnit >= 0 ? '+' : '' }}{{ formatSilver(selectedScenario.profitPerUnit) }}</dd></div>
              <div class="profit-line"><dt>Lucro por 100</dt><dd :class="{ 'negative-value': selectedScenario.profitPer100 < 0 }">{{ selectedScenario.profitPer100 >= 0 ? '+' : '' }}{{ formatSilver(selectedScenario.profitPer100) }}</dd></div>
            </dl>
          </article>

          <article class="panel materials-panel">
            <div class="panel-heading"><div><p class="eyebrow">Entrada</p><h2>Itens necessarios</h2></div></div>
            <div v-for="material in selectedScenario.materials" :key="material.itemId" class="material-row">
              <span>
                <strong>{{ material.itemName }}</strong>
                <small>{{ material.itemId }} - {{ materialPriceLabel(material) }}</small>
              </span>
              <span>{{ formatQuantity(material.requiredQuantity) }} x {{ formatSilver(material.unitPrice) }}</span>
              <span>{{ formatSilver(material.effectiveCost) }}</span>
            </div>
          </article>
        </template>
        <EmptyState v-else title="Simulador pronto" message="Escolha comida, pocao ou equipamento e informe suas condicoes reais de crafting." />
      </section>
    </div>
  </div>
</template>
