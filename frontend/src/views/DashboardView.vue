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
import { formatPercent, formatSilver } from '../utils/format.js';

const { settings } = useMarketSettings();
const { loading, error, execute } = useRequest();
const arbitrage = ref([]);
const crafts = ref([]);
const meta = ref({});

const loadDashboard = async () => {
  const result = await execute(() => Promise.all([
    api.getArbitrage({ server: settings.server, qualities: 1, minimumProfit: 1, limit: 10 }),
    api.getCraftingProfit({ server: settings.server, materialCity: 'Caerleon', saleCity: 'Caerleon', limit: 10 }),
  ]));
  if (!result) return;
  arbitrage.value = result[0].data;
  crafts.value = result[1].data;
  meta.value = result[0].meta;
};

const bestOpportunity = computed(() => arbitrage.value[0]);
const totalProfit = computed(() => arbitrage.value.reduce((sum, item) => sum + item.netProfit, 0));
const lowRiskCount = computed(() => arbitrage.value.filter((item) => item.risk.level === 'Baixo').length);
const bestCraft = computed(() => crafts.value[0]);

onMounted(loadDashboard);
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Centro de decisoes"
      title="Visao geral do mercado"
      description="Sinais praticos para decidir onde mover prata agora."
    >
      <button class="button button-primary" :disabled="loading" @click="loadDashboard">Atualizar analise</button>
    </PageHeader>

    <ErrorBanner v-if="error" :message="error" />
    <LoadingState v-if="loading" label="Cruzando cidades e receitas..." />

    <template v-else>
      <section class="hero-signal" :class="{ muted: !bestOpportunity }">
        <div>
          <p class="eyebrow">Melhor sinal agora</p>
          <h2 v-if="bestOpportunity">{{ bestOpportunity.itemName }}</h2>
          <h2 v-else>Mercado sem sinal positivo</h2>
          <p v-if="bestOpportunity">
            Comprar em <strong>{{ bestOpportunity.purchaseCity }}</strong> e vender em
            <strong>{{ bestOpportunity.saleCity }}</strong> gera a maior vantagem encontrada.
          </p>
          <p v-else>Atualize a consulta ou experimente outro servidor.</p>
        </div>
        <div v-if="bestOpportunity" class="hero-profit">
          <span>Lucro liquido/un.</span>
          <strong>{{ formatSilver(bestOpportunity.netProfit) }}</strong>
          <small>margem de {{ formatPercent(bestOpportunity.marginPercent) }}</small>
        </div>
      </section>

      <section class="metric-grid">
        <MetricCard label="Lucro mapeado" :value="formatSilver(totalProfit, true)" detail="soma do top 10 por unidade" tone="positive" />
        <MetricCard label="Melhor margem" :value="formatPercent(bestOpportunity?.marginPercent)" detail="apos taxa de mercado" tone="gold" />
        <MetricCard label="Baixo risco" :value="String(lowRiskCount)" detail="precos atualizados recentemente" />
        <MetricCard label="Melhor craft" :value="formatSilver(bestCraft?.netProfit, true)" :detail="bestCraft?.itemName || 'sem cotacao completa'" tone="blue" />
      </section>

      <section class="dashboard-grid">
        <article class="panel panel-wide">
          <div class="panel-heading">
            <div><p class="eyebrow">Rotas</p><h2>Top arbitragens</h2></div>
            <RouterLink to="/arbitrage" class="text-link">Ver analise completa</RouterLink>
          </div>
          <div v-if="arbitrage.length" class="table-wrap">
            <table>
              <thead><tr><th>Item</th><th>Rota</th><th>Compra</th><th>Venda</th><th>Lucro liquido</th><th>Margem</th><th>Risco</th></tr></thead>
              <tbody>
                <tr v-for="item in arbitrage" :key="`${item.itemId}-${item.purchaseCity}-${item.saleCity}`">
                  <td><ItemBadge :name="item.itemName" :tier="item.tier" /></td>
                  <td><span class="route"><span>{{ item.purchaseCity }}</span><b>→</b><span>{{ item.saleCity }}</span></span></td>
                  <td>{{ formatSilver(item.purchasePrice) }}</td>
                  <td>{{ formatSilver(item.salePrice) }}</td>
                  <td class="positive-value">+{{ formatSilver(item.netProfit) }}</td>
                  <td>{{ formatPercent(item.marginPercent) }}</td>
                  <td><span class="risk-badge" :class="item.risk.level.toLowerCase()">{{ item.risk.level }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <EmptyState v-else title="Nenhuma arbitragem positiva" message="O mercado pode estar equilibrado ou sem ordens suficientes." />
        </article>

        <article class="panel">
          <div class="panel-heading"><div><p class="eyebrow">Producao</p><h2>Crafts em destaque</h2></div></div>
          <div v-if="crafts.length" class="rank-list">
            <div v-for="(craft, index) in crafts.slice(0, 6)" :key="craft.itemId" class="rank-row">
              <span class="rank-number">{{ String(index + 1).padStart(2, '0') }}</span>
              <div><strong>{{ craft.itemName }}</strong><small>{{ craft.recommendation }}</small></div>
              <div class="rank-value"><strong>{{ formatSilver(craft.netProfit) }}</strong><small>{{ formatPercent(craft.marginPercent) }}</small></div>
            </div>
          </div>
          <EmptyState v-else title="Sem crafts calculaveis" message="Algum material ou produto esta sem preco em Caerleon." />
        </article>

        <article class="panel insight-panel">
          <p class="eyebrow">Leitura rapida</p>
          <h2>Qualidade do sinal</h2>
          <div class="signal-score"><strong>{{ lowRiskCount }}/{{ arbitrage.length || 0 }}</strong><span>rotas com precos recentes</span></div>
          <p>Confirme volume no jogo antes de transportar. A API publica informa preco e data, mas nao garante liquidez disponivel.</p>
          <small v-if="meta.fetchedAt">Consulta concluida agora no servidor {{ settings.server }}.</small>
        </article>
      </section>
    </template>
  </div>
</template>
