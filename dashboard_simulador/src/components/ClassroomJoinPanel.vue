<script setup lang="ts">
import { ref } from 'vue'
import { joinClassroom } from '@/services/classrooms'
import { extractApiErrorMessage } from '@/services/api'

const emit = defineEmits<{
  /** Unión confirmada: el padre muestra el aviso y recarga aulas y guías */
  joined: [message: string]
}>()

const joinCode = ref('')
const joining = ref(false)
const joinError = ref('')

async function onJoin(): Promise<void> {
  joinError.value = ''

  const code = joinCode.value.trim()
  if (!code) {
    joinError.value = 'Ingresá el código del aula'
    return
  }

  joining.value = true
  try {
    const joined = await joinClassroom(code)
    emit('joined', `Te uniste al aula "${joined.name}"`)
    joinCode.value = ''
  } catch (err) {
    // 404: código inexistente · 409: ya estás inscripto
    joinError.value = extractApiErrorMessage(err, 'No se pudo unir al aula. Verificá el código.')
  } finally {
    joining.value = false
  }
}
</script>

<template>
  <section class="card" aria-labelledby="join-classroom-title">
    <h2 id="join-classroom-title">Unirme a un aula</h2>
    <p class="muted">Ingresá el código de unión que te compartió tu docente.</p>

    <form novalidate @submit.prevent="onJoin">
      <div class="field">
        <label for="join-code">Código del aula</label>
        <input
          id="join-code"
          v-model="joinCode"
          type="text"
          maxlength="12"
          autocomplete="off"
          spellcheck="false"
          placeholder="a9f3b2"
        />
      </div>

      <p v-if="joinError" class="error" role="alert">{{ joinError }}</p>

      <div class="actions">
        <button type="submit" class="btn btn-primary" :disabled="joining">
          {{ joining ? 'Uniéndote…' : 'Unirme' }}
        </button>
      </div>
    </form>
  </section>
</template>
