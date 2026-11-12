<script setup lang="ts">
import { ref } from 'vue'
import { createClassroom } from '@/services/classrooms'
import { extractApiErrorMessage } from '@/services/api'
import type { Classroom } from '@/services/types'

const emit = defineEmits<{
  /** Aula creada: el padre muestra el aviso y recarga el listado */
  created: [message: string]
}>()

const newClassroomName = ref('')
const creating = ref(false)
const createError = ref('')
const createdClassroom = ref<Classroom | null>(null)

async function onCreate(): Promise<void> {
  createError.value = ''
  createdClassroom.value = null

  const name = newClassroomName.value.trim()
  if (!name) {
    createError.value = 'Ingresá un nombre para el aula'
    return
  }

  creating.value = true
  try {
    createdClassroom.value = await createClassroom(name)
    emit('created', `Aula "${createdClassroom.value.name}" creada`)
    newClassroomName.value = ''
  } catch (err) {
    createError.value = extractApiErrorMessage(err, 'No se pudo crear el aula.')
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <section class="card" aria-labelledby="create-classroom-title">
    <h2 id="create-classroom-title">Nueva aula</h2>

    <form novalidate @submit.prevent="onCreate">
      <div class="field">
        <label for="classroom-name">Nombre del aula</label>
        <input
          id="classroom-name"
          v-model="newClassroomName"
          type="text"
          maxlength="120"
          placeholder="5to año — comisión A"
        />
      </div>

      <p v-if="createError" class="error" role="alert">{{ createError }}</p>

      <div class="actions">
        <button type="submit" class="btn btn-primary" :disabled="creating">
          {{ creating ? 'Creando…' : 'Crear aula' }}
        </button>
      </div>
    </form>

    <!-- Código recién generado: solo lo conserva el docente dueño -->
    <div v-if="createdClassroom?.code" class="code-callout" role="status">
      <span class="code-callout-label"> Código de unión de «{{ createdClassroom.name }}» </span>
      <code class="code-callout-value">{{ createdClassroom.code }}</code>
      <span class="hint">
        Compartilo con tus alumnos: se unen desde «/aulas» con este código.
      </span>
    </div>
  </section>
</template>

<style scoped>
.code-callout {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 1rem;
  padding: 0.9rem 1rem;
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  border-radius: 10px;
}

.code-callout-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #166534;
}

.code-callout-value {
  align-self: flex-start;
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 0.28em;
  background: #fff;
  border: 1px dashed #86efac;
  border-radius: 8px;
  padding: 0.3rem 0.8rem;
  color: #14532d;
}
</style>
