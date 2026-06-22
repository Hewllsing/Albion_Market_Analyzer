<script setup>
import { ref } from 'vue';
import { RouterLink, RouterView } from 'vue-router';
import { useMarketSettings } from './composables/useMarketSettings.js';

const { settings, servers, saveSettings } = useMarketSettings();
const menuOpen = ref(false);

const navigation = [
  { to: '/', code: 'DB', label: 'Dashboard' },
  { to: '/prices', code: 'MP', label: 'Precos' },
  { to: '/arbitrage', code: 'AR', label: 'Arbitragem' },
  { to: '/crafting', code: 'CR', label: 'Crafting' },
  { to: '/watchlist', code: 'WL', label: 'Watchlist' },
];
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
        <div><strong>Albion Data Project</strong><small>Fonte comunitaria de precos</small></div>
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
        <div class="live-label"><span>LIVE</span> Dados sob demanda</div>
      </div>
      <div class="page-container"><RouterView /></div>
    </main>
  </div>
</template>
