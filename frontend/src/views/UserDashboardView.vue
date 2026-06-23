<script setup>
import { onMounted, ref } from 'vue';
import EmptyState from '../components/EmptyState.vue';
import ErrorBanner from '../components/ErrorBanner.vue';
import ItemBadge from '../components/ItemBadge.vue';
import LoadingState from '../components/LoadingState.vue';
import MetricCard from '../components/MetricCard.vue';
import PageHeader from '../components/PageHeader.vue';
import { useAuth } from '../composables/useAuth.js';
import { useRequest } from '../composables/useRequest.js';
import { api } from '../services/api.js';
import { formatDate, formatPercent, formatSilver } from '../utils/format.js';

const { authState } = useAuth();
const { loading, error, execute } = useRequest();
const dashboard = ref(null);
const watchlist = ref([]);

const loadDashboard = async () => {
  const result = await execute(() => Promise.all([
    api.getUserDashboard(),
    api.getWatchlist(),
  ]));
  if (!result) return;
  dashboard.value = result[0].data;
  watchlist.value = result[1].data;
};

onMounted(loadDashboard);
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Area pessoal"
      :title="`Meu dashboard${authState.user ? `, ${authState.user.name}` : ''}`"
      description="Suas preferencias, metas, watchlist e sinais guardados em um unico lugar."
    >
      <button class="button button-primary" :disabled="loading" @click="loadDashboard">Atualizar</button>
    </PageHeader>

    <ErrorBanner v-if="error" :message="error" />
    <LoadingState v-if="loading" label="Carregando seu dashboard..." />

    <template v-else-if="dashboard">
      <section class="metric-grid">
        <MetricCard label="Watchlist" :value="String(dashboard.watchlistCount)" detail="itens monitorados" tone="gold" />
        <MetricCard label="Favoritos" :value="String(dashboard.favoritesCount)" detail="itens marcados" tone="blue" />
        <MetricCard label="Oportunidades" :value="String(dashboard.savedOpportunitiesCount)" detail="sinais salvos" tone="positive" />
        <MetricCard label="Meta Premium" :value="formatSilver(dashboard.settings.premiumGoalSilver, true)" :detail="`${formatSilver(dashboard.settings.dailyProfitGoal, true)} meta diaria`" />
      </section>

      <section class="dashboard-grid personal-grid">
        <article class="panel">
          <div class="panel-heading"><div><p class="eyebrow">Preferencias</p><h2>{{ dashboard.settings.playerType }}</h2></div></div>
          <dl class="profile-list">
            <div><dt>Servidor principal</dt><dd>{{ dashboard.settings.primaryServer }}</dd></div>
            <div><dt>Cidade principal</dt><dd>{{ dashboard.settings.primaryCity }}</dd></div>
            <div><dt>Taxa de mercado</dt><dd>{{ formatPercent(dashboard.settings.marketTaxRate * 100) }}</dd></div>
            <div><dt>Focus</dt><dd>{{ formatPercent(dashboard.settings.focusReturnRate * 100) }}</dd></div>
          </dl>
        </article>

        <article class="panel">
          <div class="panel-heading"><div><p class="eyebrow">Watchlist propria</p><h2>{{ watchlist.length }} monitores</h2></div><RouterLink to="/watchlist" class="text-link">Editar</RouterLink></div>
          <div v-if="watchlist.length" class="rank-list">
            <div v-for="entry in watchlist.slice(0, 5)" :key="entry.id" class="rank-row">
              <span class="rank-number">WL</span>
              <div><strong>{{ entry.itemName }}</strong><small>{{ entry.itemId }}</small></div>
              <div class="rank-value"><strong>{{ formatPercent(entry.targetProfitPercent) }}</strong><small>{{ formatSilver(entry.targetNetProfit) }}</small></div>
            </div>
          </div>
          <EmptyState v-else title="Sem monitores" message="Adicione itens na watchlist para acompanhar suas metas." />
        </article>

        <article class="panel">
          <div class="panel-heading"><div><p class="eyebrow">Favoritos</p><h2>Itens marcados</h2></div><RouterLink to="/profile" class="text-link">Gerir</RouterLink></div>
          <div v-if="dashboard.favorites.length" class="rank-list">
            <div v-for="item in dashboard.favorites.slice(0, 5)" :key="item.id" class="rank-row">
              <span class="rank-number">IT</span>
              <ItemBadge :name="item.itemName" :tier="item.tier" />
              <div class="rank-value"><strong>{{ item.category }}</strong><small>{{ formatDate(item.createdAt) }}</small></div>
            </div>
          </div>
          <EmptyState v-else title="Sem favoritos" message="Marque itens importantes no perfil para montar seu repertorio." />
        </article>

        <article class="panel">
          <div class="panel-heading"><div><p class="eyebrow">Historico</p><h2>Analises recentes</h2></div></div>
          <div v-if="dashboard.analysisHistory.length" class="rank-list">
            <div v-for="entry in dashboard.analysisHistory" :key="entry.id" class="rank-row">
              <span class="rank-number">AN</span>
              <div><strong>{{ entry.summary }}</strong><small>{{ entry.analysisType }}</small></div>
              <div class="rank-value"><strong>{{ formatDate(entry.createdAt) }}</strong></div>
            </div>
          </div>
          <EmptyState v-else title="Sem analises salvas" message="A Fase 3 ja guarda historico pessoal; os atalhos de salvamento serao refinados nas proximas telas." />
        </article>
      </section>
    </template>
  </div>
</template>
