<script setup>
defineProps({ message: { type: String, required: true } });
</script>

<template><div class="error-banner"><strong>Consulta interrompida</strong><span>{{ message }}</span></div></template>
