<script setup lang="ts">
import { ref } from 'vue'
import { register } from '@/services/auth'
import { extractApiErrorMessage } from '@/services/api'
import { useCompleteLogin } from '@/composables/useCompleteLogin'

const { completeLogin } = useCompleteLogin()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

/** Valida las contraseñas antes de tocar la red; devuelve el mensaje de error o '' */
function validatePasswords(): string {
  if (password.value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (password.value !== confirmPassword.value) return 'Las contraseñas no coinciden.'
  return ''
}

async function registerAccount(): Promise<string | null> {
  try {
    const response = await register(name.value.trim(), email.value.trim(), password.value)
    return response.access_token
  } catch (err) {
    error.value = extractApiErrorMessage(err, 'No se pudo crear la cuenta. Probá de nuevo.')
    return null
  }
}

async function onSubmit() {
  if (loading.value) return

  error.value = ''

  const validationError = validatePasswords()
  if (validationError) {
    error.value = validationError
    return
  }

  loading.value = true

  // 1) Registrar la cuenta (el backend crea un usuario STUDENT y devuelve el JWT)
  const accessToken = await registerAccount()
  if (!accessToken) {
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
