<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { extractApiErrorMessage } from '@/services/api'
import { fetchMe, register } from '@/services/auth'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  if (loading.value) return

  error.value = ''

  if (password.value.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres.'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }

  loading.value = true

  // 1) Registrar la cuenta (el backend crea un usuario STUDENT y devuelve el JWT)
  let accessToken: string
  try {
    const response = await register(name.value.trim(), email.value.trim(), password.value)
    accessToken = response.access_token
  } catch (err) {
    error.value = extractApiErrorMessage(err, 'No se pudo crear la cuenta. Probá de nuevo.')
    loading.value = false
    return
  }

  authStore.setToken(accessToken)

  // 2) Cargar el perfil (GET /auth/me) para mostrarlo en el layout
  try {
    authStore.setUser(await fetchMe())
  } catch {
    // Si el perfil no carga, el interceptor 401 se encarga de la sesión
  }

  loading.value = false
  await router.push({ name: 'dashboard' })
}
</script>

<template>
  <form class="register-form" novalidate @submit.prevent="onSubmit">
    <div class="field">
      <label for="name">Nombre</label>
      <input
        id="name"
        v-model="name"
        type="text"
        name="name"
        autocomplete="name"
        placeholder="Ada Lovelace"
        required
      />
    </div>

    <div class="field">
      <label for="email">Correo electrónico</label>
      <input
        id="email"
        v-model="email"
        type="email"
        name="email"
        autocomplete="username"
        placeholder="estudiante@demo.com"
        required
      />
    </div>

    <div class="field">
      <label for="password">Contraseña</label>
      <input
        id="password"
        v-model="password"
        type="password"
        name="password"
        autocomplete="new-password"
        placeholder="Mínimo 8 caracteres"
        minlength="8"
        required
      />
    </div>

    <div class="field">
      <label for="confirm-password">Confirmar contraseña</label>
      <input
        id="confirm-password"
        v-model="confirmPassword"
        type="password"
        name="confirm-password"
        autocomplete="new-password"
        placeholder="Repetí la contraseña"
        minlength="8"
        required
      />
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <button type="submit" class="submit-btn" :disabled="loading">
      {{ loading ? 'Creando cuenta…' : 'Crear cuenta' }}
    </button>

    <p class="switch-auth">
      ¿Ya tenés cuenta?
      <router-link :to="{ name: 'login' }">Iniciar sesión</router-link>
    </p>
  </form>
</template>

<style scoped>
.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.field input {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  font-size: 0.95rem;
  color: #0f172a;
  background: #fff;
}

.field input:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 1px;
  border-color: #3b82f6;
}

.error {
  margin: 0;
  font-size: 0.85rem;
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 0.55rem 0.75rem;
}

.submit-btn {
  border: none;
  border-radius: 8px;
  padding: 0.7rem 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  background: #2563eb;
  cursor: pointer;
}

.submit-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch-auth {
  margin: 0;
  text-align: center;
  font-size: 0.85rem;
  color: #64748b;
}

.switch-auth a {
  color: #2563eb;
  font-weight: 600;
  text-decoration: none;
}

.switch-auth a:hover {
  text-decoration: underline;
}
</style>
