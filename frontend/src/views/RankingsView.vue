<script setup>
import { computed, onMounted, ref } from 'vue';
import EmptyState from '../components/EmptyState.vue';
import ErrorBanner from '../components/ErrorBanner.vue';
import ItemBadge from '../components/ItemBadge.vue';
import LoadingState from '../components/LoadingState.vue';
import MetricCard from '../components/MetricCard.vue';
import PageHeader from '../components/PageHeader.vue';
import { useMarketSettings } from '../composables/useMarketSettings.js';
import { useRequest } from '../composables/useRequest.js';
import { api } from '../services/api.js';
import { formatDate, formatPercent, formatSilver } from '../utils/format.js';

const { settings } = useMarketSettings();
const { loading, error, execute } = useRequest();
const rankings = ref({});
const meta = ref({});

const sections = computed(() => [
  { key: 'arbitrageTop', eyebrow: 'Top 10 arbitragem', title: 'Rotas entre cidades' },
  { key: 'craftingTop', eyebrow: 'Top 10 crafting', title: 'Itens para craftar' },
  { key: 'refiningTop', eyebrow: 'Top 10 refino', title: 'Recursos para refinar' },
  { key: 'consumablesTop', eyebrow: 'Top 10 consumiveis', title: 'Pocoes e comidas' },
  { key: 'blackMarketTop', eyebrow: 'Top 10 Black Market', title: 'Venda para Black Market' },
  { key: 'priceDropsTop', eyebrow: 'Queda de preco', title: 'Abaixo do historico' },
  { key: 'marginTop', eyebrow: 'Maior margem', title: 'Spread entre cidades' },
]);

const bestSignal = computed(() => rankings.value.overallTop?.[0]);
const highScoreCount = computed(() => (rankings.value.overallTop || [])
  .filter((entry) => entry.opportunityScore >= 65).length);
const highRiskCount = computed(() => Object.values(rankings.value)
  .flat()
  .filter((entry) => entry?.risk?.level === 'Alto').length);

const loadRankings = async () => {
  const result = await execute(() => api.getRankings({
    server: settings.server,
    marketTaxRate: settings.marketTaxPercent / 100,
    limit: 10,
  }));
  if (!result) return;
  rankings.value = result.data;
  meta.value = result.meta;
};

const entrySubtitle = (entry) => {
  if (entry.type === 'price-drop') return `${entry.city} - queda de ${formatPercent(entry.dropPercent)}`;
  if (entry.type === 'crafting') return `${entry.materialCity} -> ${entry.saleCity}`;
  if (entry.type === 'refining') return `${entry.materialCity} -> ${entry.saleCity}`;
  if (entry.purchaseCity && entry.saleCity) return `${entry.purchaseCity} -> ${entry.saleCity}`;
  return entry.city || entry.category || 'Mercado';
};

const entryValue = (entry) => {
  if (entry.type === 'price-drop') return formatSilver(entry.dropAmount);
  if (entry.netProfit !== undefined) return formatSilver(entry.netProfit, true);
  if (entry.marginPercent !== undefined) return formatPercent(entry.marginPercent);
  return '-';
};

const entryDetail = (entry) => {
  if (entry.type === 'price-drop') return `atual ${formatSilver(entry.currentPrice)}`;
  if (entry.marginPercent !== undefined) return formatPercent(entry.marginPercent);
  return entry.opportunityRecommendation || '';
};

onMounted(loadRankings);
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Fase 2"
      title="Rankings de oportunidade"
      description="Compare lucro, liquidez aproximada, frescor dos dados e risco estimado em um score unico."
    >
      <button class="button button-primary" :disabled="loading" @click="loadRankings">Atualizar rankings</button>
    </PageHeader>

    <ErrorBanner v-if="error" :message="error" />
    <LoadingState v-if="loading" label="Calculando rankings e scores..." />

    <template v-else>
      <section class="metric-grid">
        <MetricCard label="Melhor score" :value="String(bestSignal?.opportunityScore || 0)" :detail="bestSignal?.itemName || 'sem sinal'" tone="gold" />
        <MetricCard label="Sinais fortes" :value="String(highScoreCount)" detail="score acima de 65 no ranking geral" tone="positive" />
        <MetricCard label="Risco alto" :value="String(highRiskCount)" detail="sinais penalizados pelo modelo" tone="neutral" />
        <MetricCard label="Servidor" :value="settings.server" :detail="meta.fetchedAt ? formatDate(meta.fetchedAt) : 'aguardando consulta'" tone="blue" />
      </section>

      <article class="panel phase-note">
        <div>
          <p class="eyebrow">Opportunity Score</p>
          <h2>Formula pratica</h2>
        </div>
        <p>Score = margem + liquidez aproximada + atualizacao recente - risco. O risco considera rota, distancia, frescor, liquidez nao imediata, variacao recente e margens fora do normal.</p>
      </article>

      <article class="panel">
        <div class="panel-heading">
          <div><p class="eyebrow">Ranking geral</p><h2>Melhores sinais agora</h2></div>
          <span class="data-note">Ordenado por score</span>
        </div>
        <div v-if="rankings.overallTop?.length" class="ranking-list ranking-list-wide">
          <div v-for="(entry, index) in rankings.overallTop" :key="`${entry.type}-${entry.itemId}-${index}`" class="ranking-row">
            <span class="rank-number">{{ String(index + 1).padStart(2, '0') }}</span>
            <ItemBadge :name="entry.itemName" :tier="entry.tier" />
            <div class="ranking-main"><strong>{{ entrySubtitle(entry) }}</strong><small>{{ entry.opportunityRecommendation }} - risco {{ entry.risk?.level || 'n/a' }}</small></div>
            <div class="ranking-value"><strong>{{ entryValue(entry) }}</strong><small>{{ entryDetail(entry) }}</small></div>
            <span class="score-pill">{{ entry.opportunityScore || 0 }}</span>
          </div>
        </div>
        <EmptyState v-else title="Sem ranking geral" message="Ainda nao ha dados suficientes para montar sinais comparaveis." />
      </article>

      <section class="ranking-section-grid">
        <article v-for="section in sections" :key="section.key" class="panel ranking-card">
          <div class="panel-heading">
            <div><p class="eyebrow">{{ section.eyebrow }}</p><h2>{{ section.title }}</h2></div>
          </div>
          <div v-if="rankings[section.key]?.length" class="ranking-list">
            <div v-for="(entry, index) in rankings[section.key]" :key="`${section.key}-${entry.itemId}-${index}`" class="ranking-row compact">
              <span class="rank-number">{{ String(index + 1).padStart(2, '0') }}</span>
              <div class="ranking-main"><strong>{{ entry.itemName }}</strong><small>{{ entrySubtitle(entry) }}</small></div>
              <div class="ranking-value"><strong>{{ entry.opportunityScore || 0 }}</strong><small>{{ entryDetail(entry) }}</small></div>
            </div>
          </div>
          <EmptyState v-else title="Sem sinais" message="Nao houve dados suficientes ou oportunidades positivas nesta categoria." />
        </article>
      </section>
    </template>
  </div>
</template>
