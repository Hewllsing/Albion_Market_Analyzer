<script setup>
defineProps({
  title: { type: String, default: 'Nenhum dado encontrado' },
  message: { type: String, default: 'Ajuste os filtros e tente novamente.' },
});
</script>

<template>
  <div class="state-card empty-state">
    <span class="empty-icon">0</span>
    <div><strong>{{ title }}</strong><small>{{ message }}</small></div>
  </div>
</template>
