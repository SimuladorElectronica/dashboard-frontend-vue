<script setup lang="ts">
import { ref } from 'vue'
import { extractApiErrorMessage } from '@/services/api'
import { login } from '@/services/auth'
import { useCompleteLogin } from '@/composables/useCompleteLogin'

const { completeLogin } = useCompleteLogin()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function onSubmit() {
  if (loading.value) return

  loading.value = true
  error.value = ''

  // 1) Pedir el JWT
  let accessToken: string
  try {
    const response = await login(email.value.trim(), password.value)
    accessToken = response.access_token
  } catch (err) {
    error.value = extractApiErrorMessage(
      err,
      'No se pudo iniciar sesión. Verificá tus credenciales.',
    )
    loading.value = false
    return
  }

  loading.value = false
  await completeLogin(accessToken)
}
</script>

<template>
  <form class="auth-form" novalidate @submit.prevent="onSubmit">
    <div class="field">
      <label for="email">Correo electrónico</label>
      <input
        id="email"
        v-model="email"
        type="email"
        name="email"
        autocomplete="username"
        placeholder="profe@demo.com"
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
        autocomplete="current-password"
        placeholder="••••••••"
        required
      />
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <button type="submit" class="submit-btn" :disabled="loading">
      {{ loading ? 'Ingresando…' : 'Ingresar' }}
    </button>

    <p class="switch-auth">
      ¿No tenés cuenta?
      <router-link :to="{ name: 'register' }">Crear cuenta</router-link>
    </p>

    <p class="hint hint--center">Docente de prueba: profe@demo.com</p>
  </form>
</template>

<style scoped>
.hint--center {
  margin: 0;
  text-align: center;
  font-size: 0.78rem;
}
</style>
