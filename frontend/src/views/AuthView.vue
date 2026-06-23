<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ErrorBanner from '../components/ErrorBanner.vue';
import PageHeader from '../components/PageHeader.vue';
import { useAuth } from '../composables/useAuth.js';
import { useRequest } from '../composables/useRequest.js';
import { api } from '../services/api.js';

const route = useRoute();
const router = useRouter();
const { login, register } = useAuth();
const { loading, error, execute } = useRequest();
const mode = ref('login');
const resetToken = ref('');
const notice = ref('');
const form = reactive({
  name: '',
  email: '',
  password: '',
  token: '',
  newPassword: '',
});

const destination = () => route.query.redirect || '/my';

const submitAuth = async () => {
  notice.value = '';
  const action = mode.value === 'register'
    ? () => register({ name: form.name, email: form.email, password: form.password })
    : () => login({ email: form.email, password: form.password });
  const response = await execute(action);
  if (response) router.push(destination());
};

const requestReset = async () => {
  notice.value = '';
  const response = await execute(() => api.requestPasswordReset({ email: form.email }));
  if (!response) return;
  resetToken.value = response.data.resetToken || '';
  notice.value = response.data.message;
};

const confirmReset = async () => {
  notice.value = '';
  const response = await execute(() => api.confirmPasswordReset({
    token: form.token || resetToken.value,
    password: form.newPassword,
  }));
  if (!response) return;
  notice.value = response.data.message;
  mode.value = 'login';
};
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Fase 3"
      title="Conta do utilizador"
      description="Entre, crie uma conta ou recupere acesso para usar dashboard individual, preferencias e watchlist propria."
    />

    <section class="auth-layout">
      <form class="panel auth-card" @submit.prevent="submitAuth">
        <div class="auth-tabs">
          <button type="button" :class="{ active: mode === 'login' }" @click="mode = 'login'">Entrar</button>
          <button type="button" :class="{ active: mode === 'register' }" @click="mode = 'register'">Cadastrar</button>
          <button type="button" :class="{ active: mode === 'reset' }" @click="mode = 'reset'">Recuperar</button>
        </div>

        <ErrorBanner v-if="error" :message="error" />
        <div v-if="notice" class="success-banner">{{ notice }}</div>

        <template v-if="mode !== 'reset'">
          <label v-if="mode === 'register'">Nome<input v-model="form.name" required placeholder="Seu nome" /></label>
          <label>Email<input v-model="form.email" required type="email" placeholder="voce@email.com" /></label>
          <label>Senha<input v-model="form.password" required type="password" minlength="8" placeholder="Minimo 8 caracteres" /></label>
          <button class="button button-primary button-block" :disabled="loading">{{ mode === 'register' ? 'Criar conta' : 'Entrar' }}</button>
        </template>

        <template v-else>
          <label>Email<input v-model="form.email" required type="email" placeholder="voce@email.com" /></label>
          <button type="button" class="button button-block" :disabled="loading" @click="requestReset">Gerar token</button>
          <label>Token<input v-model="form.token" :placeholder="resetToken || 'Cole o token aqui'" /></label>
          <label>Nova senha<input v-model="form.newPassword" type="password" minlength="8" placeholder="Minimo 8 caracteres" /></label>
          <button type="button" class="button button-primary button-block" :disabled="loading" @click="confirmReset">Atualizar senha</button>
          <p v-if="resetToken" class="form-footnote">Token local de desenvolvimento: {{ resetToken }}</p>
        </template>
      </form>

      <article class="panel auth-explainer">
        <p class="eyebrow">O que desbloqueia</p>
        <h2>Multiusuario real</h2>
        <p>Cada conta possui watchlist, favoritos, oportunidades salvas, historico de analises e preferencias proprias de servidor, cidade, taxa e Focus.</p>
      </article>
    </section>
  </div>
</template>
