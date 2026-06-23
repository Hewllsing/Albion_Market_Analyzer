<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { useAuth } from './composables/useAuth.js';
import { useMarketSettings } from './composables/useMarketSettings.js';

const { settings, servers, saveSettings } = useMarketSettings();
const { authState, loadMe, logout } = useAuth();
const menuOpen = ref(false);

const baseNavigation = [
  { to: '/', code: 'DB', label: 'Dashboard' },
  { to: '/prices', code: 'MP', label: 'Precos' },
  { to: '/arbitrage', code: 'AR', label: 'Arbitragem' },
  { to: '/crafting', code: 'CR', label: 'Crafting' },
  { to: '/rankings', code: 'R2', label: 'Rankings' },
];
const userNavigation = [
  { to: '/my', code: 'ME', label: 'Meu Dashboard' },
  { to: '/watchlist', code: 'WL', label: 'Watchlist' },
  { to: '/profile', code: 'PF', label: 'Perfil' },
];

const navigation = computed(() => [
  ...baseNavigation,
  ...(authState.user ? userNavigation : [{ to: '/login', code: 'IN', label: 'Entrar' }]),
]);

onMounted(() => {
  if (localStorage.getItem('ama:token')) loadMe().catch(() => {});
});
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar" :class="{ open: menuOpen }">
      <div class="brand">
        <span class="brand-sigil">A</span>
        <div><strong>Albion</strong><small>Market Analyzer</small></div>
      </div>
      <nav>
        <RouterLink v-for="item in navigation" :key="item.to" :to="item.to" @click="menuOpen = false">
          <span>{{ item.code }}</span>{{ item.label }}
        </RouterLink>
      </nav>
      <div class="sidebar-note">
        <span class="status-dot"></span>
        <div v-if="authState.user"><strong>{{ authState.user.name }}</strong><small>{{ authState.user.email }}</small></div>
        <div v-else><strong>Albion Data Project</strong><small>Fonte comunitaria de precos</small></div>
      </div>
    </aside>

    <main class="main-panel">
      <div class="topbar">
        <button class="menu-button" type="button" @click="menuOpen = !menuOpen">Menu</button>
        <div class="server-control">
          <span class="status-dot"></span>
          <label for="global-server">Servidor</label>
          <select id="global-server" v-model="settings.server" @change="saveSettings">
            <option v-for="server in servers" :key="server.value" :value="server.value">{{ server.label }}</option>
          </select>
        </div>
        <button v-if="authState.user" type="button" class="button button-ghost" @click="logout">Sair</button>
        <div class="live-label"><span>LIVE</span> Dados sob demanda</div>
      </div>
      <div class="page-container"><RouterView /></div>
    </main>
  </div>
</template>
