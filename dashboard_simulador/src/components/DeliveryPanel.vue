<script setup lang="ts">
import { ref } from 'vue'
import { createSubmission } from '@/services/submissions'
import { extractApiErrorMessage } from '@/services/api'
import type { Guide, ProjectSummary } from '@/services/types'

defineProps<{
  guides: Guide[]
  projects: ProjectSummary[]
}>()

const emit = defineEmits<{
  /** Entrega registrada: el padre recarga la tabla de entregas */
  submitted: []
}>()

const deliveryGuideId = ref('')
const deliveryProjectId = ref('')
const deliverySubmitting = ref(false)
const deliveryError = ref('')
const deliveryNotice = ref('')

/**
 * Entrega un proyecto propio a una guía (alumno):
 * vincula el proyecto seleccionado con la guía elegida.
 */
async function submitDelivery(): Promise<void> {
  deliveryError.value = ''
  deliveryNotice.value = ''

  if (!deliveryGuideId.value) {
    deliveryError.value = 'Elegí una guía para entregar'
    return
  }
  if (!deliveryProjectId.value) {
    deliveryError.value = 'Elegí tu proyecto entregado'
    return
  }

  deliverySubmitting.value = true
  try {
    await createSubmission(deliveryGuideId.value, deliveryProjectId.value)
    deliveryNotice.value = 'Entrega registrada correctamente'
    deliveryGuideId.value = ''
    deliveryProjectId.value = ''
    emit('submitted')
  } catch (err) {
    deliveryError.value = extractApiErrorMessage(err, 'No se pudo registrar la entrega.')
  } finally {
    deliverySubmitting.value = false
  }
}
</script>

<template>
  <section class="card" aria-labelledby="delivery-form-title">
    <div class="card-header">
      <h2 id="delivery-form-title">Entregar a una guía</h2>
    </div>

    <p class="muted">
      Elegí la guía y el proyecto que querés entregar. La entrega queda visible para el docente.
    </p>

    <div class="delivery-fields">
      <div class="field">
        <label for="delivery-guide">Guía</label>
        <select id="delivery-guide" v-model="deliveryGuideId">
          <option value="">— Elegí una guía —</option>
          <option v-for="guide in guides" :key="guide.id" :value="guide.id">
            {{ guide.title }} · {{ guide.classroom?.name ?? '' }}
          </option>
        </select>
      </div>

      <div class="field">
        <label for="delivery-project">Tu proyecto</label>
        <select id="delivery-project" v-model="deliveryProjectId">
          <option value="">— Elegí tu proyecto —</option>
          <option v-for="project in projects" :key="project.id" :value="project.id">
            {{ project.title }} · {{ project.shareSlug }}
          </option>
        </select>
      </div>
    </div>

    <p v-if="deliveryError" class="error" role="alert">{{ deliveryError }}</p>
    <p v-if="deliveryNotice" class="notice" role="status">{{ deliveryNotice }}</p>

    <div class="actions">
      <button
        type="button"
        class="btn btn-primary"
        :disabled="deliverySubmitting"
        @click="submitDelivery"
      >
        {{ deliverySubmitting ? 'Entregando…' : 'Entregar' }}
      </button>
    </div>
  </section>
</template>
