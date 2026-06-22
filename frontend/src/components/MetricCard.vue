<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  detail: { type: String, default: '' },
  tone: { type: String, default: 'neutral' },
});
</script>

<template>
  <article class="metric-card" :class="`metric-${tone}`">
    <div class="metric-top"><span>{{ label }}</span><span class="metric-mark"></span></div>
    <strong>{{ value }}</strong>
    <small>{{ detail }}</small>
  </article>
</template>
