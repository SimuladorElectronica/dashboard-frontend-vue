<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { extractApiErrorMessage } from '@/services/api'
import { fetchMe } from '@/services/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const status = ref<'working' | 'error'>('working')
const message = ref('Validando tu sesión…')

/**
 * Acepta el token por query param (`?access_token=…`) o por hash
 * (`/auth/token#access_token=…`, como el flujo implícito de OAuth).
 * El hash evita que el token llegue a logs de servidores.
 */
function extractToken(): string {
  const query = route.query.access_token
  if (typeof query === 'string' && query.trim()) return query.trim()

  const hash = window.location.hash.replace(/^#/, '')
  const hashParams = new URLSearchParams(hash)
  return (hashParams.get('access_token') ?? '').trim()
}

onMounted(async () => {
  const token = extractToken()

  if (!token) {
    status.value = 'error'
    message.value =
      'No se recibió un access_token en la URL. Iniciá sesión de nuevo desde el simulador.'
    return
  }

  // Guardar el token para que el interceptor lo use en todas las peticiones
  authStore.setToken(token)

  try {
    authStore.setUser(await fetchMe())
  } catch (err) {
    // Token inválido o expirado: descartar sesión y avisar
    authStore.logout()
    status.value = 'error'
    message.value = extractApiErrorMessage(
      err,
      'El token no es válido o expiró. Iniciá sesión de nuevo desde el simulador.',
    )
    return
  }

  // Redirigir al dashboard y limpiar la URL (el token no queda en el historial)
  await router.replace({ name: 'dashboard' })
})
</script>

<template>
  <div class="token-login">
    <div class="token-card">
      <template v-if="status === 'working'">
        <div class="spinner" aria-hidden="true" />
        <p class="muted">{{ message }}</p>
      </template>
      <template v-else>
        <p class="error" role="alert">{{ message }}</p>
        <router-link class="btn btn-primary" :to="{ name: 'login' }"> Ir al login </router-link>
      </template>
    </div>
  </div>
</template>

<style scoped>
.token-login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1.5rem;
}

.token-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  max-width: 420px;
  text-align: center;
}

.spinner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
    border-top-color: #2563eb;
  }
}
</style>
