import { ref } from 'vue';

export const useRequest = () => {
  const loading = ref(false);
  const error = ref('');

  const execute = async (request) => {
    loading.value = true;
    error.value = '';
    try {
      return await request();
    } catch (requestError) {
      error.value = requestError.response?.data?.error?.message || requestError.message || 'Algo deu errado.';
      return null;
    } finally {
      loading.value = false;
    }
  };

  return { loading, error, execute };
};
