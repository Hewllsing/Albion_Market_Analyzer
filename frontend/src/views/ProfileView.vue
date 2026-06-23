<script setup>
import { onMounted, reactive, ref } from 'vue';
import EmptyState from '../components/EmptyState.vue';
import ErrorBanner from '../components/ErrorBanner.vue';
import ItemBadge from '../components/ItemBadge.vue';
import LoadingState from '../components/LoadingState.vue';
import PageHeader from '../components/PageHeader.vue';
import { useAuth } from '../composables/useAuth.js';
import { useMarketSettings } from '../composables/useMarketSettings.js';
import { useRequest } from '../composables/useRequest.js';
import { api } from '../services/api.js';
import { formatDate, formatPercent, formatSilver } from '../utils/format.js';

const { authState, updateLocalSession } = useAuth();
const { cities, servers } = useMarketSettings();
const { loading, error, execute } = useRequest();
const notice = ref('');
const items = ref([]);
const favorites = ref([]);
const savedOpportunities = ref([]);
const analysisHistory = ref([]);
const profile = reactive({ name: '', email: '' });
const settings = reactive({
  primaryServer: 'europe',
  primaryCity: 'Caerleon',
  language: 'pt-BR',
  currencyServer: 'europe',
  marketTaxRate: 0.065,
  focusReturnRate: 0.479,
  playerType: 'Trader',
  premiumGoalSilver: 0,
  dailyProfitGoal: 0,
});
const favoriteForm = reactive({ itemId: '' });
const opportunityForm = reactive({
  title: '',
  opportunityType: 'manual',
  itemId: '',
  targetNetProfit: 0,
  targetMarginPercent: 0,
});
const historyForm = reactive({ analysisType: 'manual', summary: '' });

const playerTypes = ['Crafter', 'Refinador', 'Trader', 'Black Market', 'Gatherer', 'PvP Seller'];

const load = async () => {
  const result = await execute(() => Promise.all([
    api.getMe(),
    api.getFavorites(),
    api.getSavedOpportunities(),
    api.getAnalysisHistory({ limit: 10 }),
    api.getItems(),
  ]));
  if (!result) return;
  const me = result[0].data;
  Object.assign(profile, me.user);
  Object.assign(settings, me.settings);
  updateLocalSession({ user: me.user, settings: me.settings });
  favorites.value = result[1].data;
  savedOpportunities.value = result[2].data;
  analysisHistory.value = result[3].data;
  items.value = result[4].data;
  favoriteForm.itemId = items.value[0]?.itemId || '';
  opportunityForm.itemId = items.value[0]?.itemId || '';
};

const saveProfile = async () => {
  notice.value = '';
  const result = await execute(() => api.updateProfile(profile));
  if (!result) return;
  updateLocalSession({ user: result.data.user });
  notice.value = 'Perfil atualizado.';
};

const saveUserSettings = async () => {
  notice.value = '';
  const result = await execute(() => api.updateUserSettings(settings));
  if (!result) return;
  Object.assign(settings, result.data);
  updateLocalSession({ settings: result.data });
  notice.value = 'Preferencias atualizadas.';
};

const addUserFavorite = async () => {
  const result = await execute(() => api.addFavorite(favoriteForm));
  if (result) favorites.value = result.data;
};

const removeUserFavorite = async (favorite) => {
  const ok = await execute(() => api.removeFavorite(favorite.id).then(() => true));
  if (ok) favorites.value = favorites.value.filter((item) => item.id !== favorite.id);
};

const addOpportunity = async () => {
  const result = await execute(() => api.addSavedOpportunity(opportunityForm));
  if (result) {
    savedOpportunities.value = result.data;
    opportunityForm.title = '';
  }
};

const addHistory = async () => {
  const result = await execute(() => api.addAnalysisHistory(historyForm));
  if (result) {
    analysisHistory.value = result.data;
    historyForm.summary = '';
  }
};

onMounted(load);
</script>

<template>
  <div>
    <PageHeader eyebrow="Conta" title="Perfil e preferencias" description="Defina como o Albion Market Analyzer deve pensar para o seu estilo de jogo." />
    <ErrorBanner v-if="error" :message="error" />
    <div v-if="notice" class="success-banner">{{ notice }}</div>
    <LoadingState v-if="loading && !items.length" label="Carregando perfil..." />

    <section v-else class="profile-layout">
      <form class="panel" @submit.prevent="saveProfile">
        <div class="panel-heading"><div><p class="eyebrow">Identidade</p><h2>Perfil</h2></div></div>
        <label>Nome<input v-model="profile.name" required /></label>
        <label>Email<input v-model="profile.email" required type="email" /></label>
        <button class="button button-primary button-block" :disabled="loading">Salvar perfil</button>
      </form>

      <form class="panel" @submit.prevent="saveUserSettings">
        <div class="panel-heading"><div><p class="eyebrow">Mercado</p><h2>Preferencias</h2></div></div>
        <div class="form-grid">
          <label>Servidor principal<select v-model="settings.primaryServer"><option v-for="server in servers" :key="server.value" :value="server.value">{{ server.label }}</option></select></label>
          <label>Cidade principal<select v-model="settings.primaryCity"><option v-for="city in cities" :key="city">{{ city }}</option></select></label>
          <label>Idioma<select v-model="settings.language"><option value="pt-BR">Portugues</option><option value="en-US">English</option></select></label>
          <label>Moeda/Servidor<select v-model="settings.currencyServer"><option v-for="server in servers" :key="server.value" :value="server.value">{{ server.label }}</option></select></label>
          <label>Tipo de jogador<select v-model="settings.playerType"><option v-for="type in playerTypes" :key="type">{{ type }}</option></select></label>
          <label>Taxa mercado (%)<input v-model.number="settings.marketTaxRate" type="number" min="0" max="1" step="0.001" /></label>
          <label>Focus return (%)<input v-model.number="settings.focusReturnRate" type="number" min="0" max="0.95" step="0.001" /></label>
          <label>Meta Premium<input v-model.number="settings.premiumGoalSilver" type="number" min="0" step="100000" /></label>
          <label>Meta diaria<input v-model.number="settings.dailyProfitGoal" type="number" min="0" step="10000" /></label>
        </div>
        <p class="form-footnote">Taxa e Focus ficam em decimal. Ex.: 0.065 = 6,5%.</p>
        <button class="button button-primary button-block" :disabled="loading">Salvar preferencias</button>
      </form>

      <form class="panel" @submit.prevent="addUserFavorite">
        <div class="panel-heading"><div><p class="eyebrow">Favoritos</p><h2>Itens favoritos</h2></div></div>
        <label>Item<select v-model="favoriteForm.itemId"><option v-for="item in items" :key="item.itemId" :value="item.itemId">{{ item.name }}</option></select></label>
        <button class="button button-primary button-block" :disabled="loading">Adicionar favorito</button>
        <div v-if="favorites.length" class="mini-list">
          <div v-for="favorite in favorites" :key="favorite.id">
            <ItemBadge :name="favorite.itemName" :tier="favorite.tier" />
            <button type="button" class="icon-button" @click="removeUserFavorite(favorite)">Remover</button>
          </div>
        </div>
        <EmptyState v-else title="Sem favoritos" message="Adicione itens para acelerar filtros e dashboards pessoais." />
      </form>

      <form class="panel" @submit.prevent="addOpportunity">
        <div class="panel-heading"><div><p class="eyebrow">Oportunidades</p><h2>Salvar sinal</h2></div></div>
        <label>Titulo<input v-model="opportunityForm.title" required placeholder="Ex.: Comprar T6 cloth barato" /></label>
        <label>Tipo<input v-model="opportunityForm.opportunityType" /></label>
        <label>Item<select v-model="opportunityForm.itemId"><option value="">Sem item</option><option v-for="item in items" :key="item.itemId" :value="item.itemId">{{ item.name }}</option></select></label>
        <label>Lucro alvo<input v-model.number="opportunityForm.targetNetProfit" type="number" min="0" step="1000" /></label>
        <label>Margem alvo (%)<input v-model.number="opportunityForm.targetMarginPercent" type="number" min="0" step="1" /></label>
        <button class="button button-primary button-block" :disabled="loading">Salvar oportunidade</button>
        <div v-if="savedOpportunities.length" class="mini-list">
          <div v-for="opportunity in savedOpportunities.slice(0, 5)" :key="opportunity.id">
            <span><strong>{{ opportunity.title }}</strong><small>{{ opportunity.opportunityType }} - {{ formatSilver(opportunity.targetNetProfit) }} - {{ formatPercent(opportunity.targetMarginPercent) }}</small></span>
          </div>
        </div>
      </form>

      <form class="panel" @submit.prevent="addHistory">
        <div class="panel-heading"><div><p class="eyebrow">Historico</p><h2>Registrar analise</h2></div></div>
        <label>Tipo<input v-model="historyForm.analysisType" /></label>
        <label>Resumo<input v-model="historyForm.summary" required placeholder="Ex.: Analisei T5 couro em Caerleon" /></label>
        <button class="button button-primary button-block" :disabled="loading">Salvar analise</button>
        <div v-if="analysisHistory.length" class="mini-list">
          <div v-for="entry in analysisHistory" :key="entry.id">
            <span><strong>{{ entry.summary }}</strong><small>{{ entry.analysisType }} - {{ formatDate(entry.createdAt) }}</small></span>
          </div>
        </div>
      </form>
    </section>
  </div>
</template>
