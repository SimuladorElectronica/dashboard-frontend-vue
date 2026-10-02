import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('jwt_token'));
  const user = ref<null | { id: string; email: string; role: string }>(null);

  const isAuthenticated = computed(() => !!token.value);

  function setToken(newToken: string) {
    token.value = newToken;
    localStorage.setItem('jwt_token', newToken);
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('jwt_token');
  }

  return { token, user, isAuthenticated, setToken, logout };
});