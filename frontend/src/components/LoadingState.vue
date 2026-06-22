<script setup>
defineProps({ label: { type: String, default: 'Consultando o mercado...' } });
</script>

<template>
  <div class="state-card loading-state">
    <span class="spinner"></span>
    <div><strong>{{ label }}</strong><small>Os precos publicos podem levar alguns segundos.</small></div>
  </div>
</template>
