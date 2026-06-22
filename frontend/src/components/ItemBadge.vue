<script setup>
defineProps({ name: { type: String, required: true }, tier: { type: Number, default: null } });
</script>

<template>
  <div class="item-cell">
    <span class="item-glyph">{{ tier ? `T${tier}` : name.slice(0, 2).toUpperCase() }}</span>
    <span><strong>{{ name }}</strong><small v-if="tier">Tier {{ tier }}</small></span>
  </div>
</template>
