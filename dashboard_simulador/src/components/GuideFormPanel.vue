<script setup lang="ts">
import { toRef } from 'vue'
import { useGuideForm, type GuideEditRequest } from '@/composables/useGuideForm'
import type { Classroom, ProjectSummary } from '@/services/types'

const props = defineProps<{
  classrooms: Classroom[]
  projects: ProjectSummary[]
  /** Solicitud de edición del listado; null = modo alta */
  editRequest: GuideEditRequest | null
}>()

const emit = defineEmits<{
  /** La guía se guardó: el padre muestra el aviso y recarga los listados */
  saved: [message: string]
}>()

const {
  form,
  fieldErrors,
  isEditing,
  submitting,
  formError,
  onSubmit,
  resetForm,
  onProjectChange,
  markUrlTouched,
} = useGuideForm({
  projects: toRef(props, 'projects'),
  editRequest: toRef(props, 'editRequest'),
  onSaved: (message) => emit('saved', message),
})
</script>

<template>
  <section class="card" aria-labelledby="form-title">
    <h2 id="form-title">{{ isEditing ? 'Editar guía' : 'Nueva guía' }}</h2>

    <form novalidate @submit.prevent="onSubmit">
      <div class="field">
        <label for="guide-title">Título</label>
        <input
          id="guide-title"
          v-model="form.title"
          type="text"
          maxlength="200"
          placeholder="Práctica 1 — LED parpadeante"
        />
        <span v-if="fieldErrors.title" class="field-error">{{ fieldErrors.title }}</span>
      </div>

      <div class="field">
        <label for="guide-instructions">Instrucciones (consigna)</label>
        <textarea
          id="guide-instructions"
          v-model="form.instructions"
          rows="6"
          maxlength="10000"
          placeholder="Conectá un LED al pin 13 con resistencia de 220Ω y hacélo parpadear cada segundo."
        ></textarea>
        <span v-if="fieldErrors.instructions" class="field-error">
          {{ fieldErrors.instructions }}
        </span>
      </div>

      <div class="field">
        <label for="guide-classroom">Aula</label>
        <select id="guide-classroom" v-model="form.classroomId">
          <option value="">— Elegí el aula —</option>
          <option v-for="classroom in classrooms" :key="classroom.id" :value="classroom.id">
            {{ classroom.name }}
          </option>
        </select>
        <span class="hint"> La guía solo la verán los alumnos inscriptos en el aula. </span>
        <span v-if="classrooms.length === 0" class="hint">
          Todavía no tenés aulas.
          <router-link to="/aulas">Creá una en Gestión de Aulas</router-link>.
        </span>
        <span v-if="fieldErrors.classroom" class="field-error">{{ fieldErrors.classroom }}</span>
      </div>

      <div class="field">
        <label for="guide-project">Proyecto inicial plantilla</label>
        <select id="guide-project" v-model="form.projectId" @change="onProjectChange">
          <option value="">— Elegir de mis proyectos —</option>
          <option v-for="project in projects" :key="project.id" :value="project.id">
            {{ project.title }} · {{ project.shareSlug }}{{ project.isTemplate ? ' · plantilla' : '' }}
          </option>
        </select>
        <span class="hint">
          Elegí un proyecto propio o pegá su URL abajo. Los marcados como plantilla abren
          en el simulador como circuito inicial de la guía.
        </span>
      </div>

      <div class="field">
        <label for="guide-url">URL del circuito plantilla</label>
        <input
          id="guide-url"
          v-model="form.templateUrl"
          type="text"
          placeholder="http://localhost:5174/share/a9f3b2"
          @input="markUrlTouched"
        />
        <span class="hint">
          Acepta una URL de plantilla, un shareSlug de 6 caracteres o el UUID del proyecto.
        </span>
        <span v-if="fieldErrors.template" class="field-error">{{ fieldErrors.template }}</span>
      </div>

      <p v-if="formError" class="error" role="alert">{{ formError }}</p>

      <div class="actions">
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          {{ submitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear guía' }}
        </button>
        <button v-if="isEditing" type="button" class="btn btn-ghost" @click="resetForm">
          Cancelar
        </button>
      </div>
    </form>
  </section>
</template>
