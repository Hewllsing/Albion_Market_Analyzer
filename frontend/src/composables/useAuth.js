import { reactive } from 'vue';
import { api, setAuthToken } from '../services/api.js';

const savedUser = JSON.parse(localStorage.getItem('ama:user') || 'null');
const savedSettings = JSON.parse(localStorage.getItem('ama:userSettings') || 'null');

const authState = reactive({
  user: savedUser,
  settings: savedSettings,
  ready: false,
});

const persistSession = ({ token, user, settings }) => {
  if (token) setAuthToken(token);
  authState.user = user;
  authState.settings = settings;
  localStorage.setItem('ama:user', JSON.stringify(user));
  localStorage.setItem('ama:userSettings', JSON.stringify(settings || null));
};

export const useAuth = () => {
  const register = async (payload) => {
    const response = await api.register(payload);
    persistSession(response.data);
    return response;
  };

  const login = async (payload) => {
    const response = await api.login(payload);
    persistSession(response.data);
    return response;
  };

  const loadMe = async () => {
    try {
      const response = await api.getMe();
      persistSession({ user: response.data.user, settings: response.data.settings });
      return response;
    } catch (error) {
      logout();
      throw error;
    } finally {
      authState.ready = true;
    }
  };

  const updateLocalSession = ({ user, settings }) => {
    persistSession({
      user: user || authState.user,
      settings: settings || authState.settings,
    });
  };

  const logout = () => {
    setAuthToken('');
    authState.user = null;
    authState.settings = null;
    authState.ready = true;
    localStorage.removeItem('ama:user');
    localStorage.removeItem('ama:userSettings');
  };

  return {
    authState,
    register,
    login,
    loadMe,
    logout,
    updateLocalSession,
  };
};
