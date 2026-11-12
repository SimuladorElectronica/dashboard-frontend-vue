<script setup lang="ts">
import { formatDate } from '@/utils/format'
import type { Classroom } from '@/services/types'

defineProps<{
  classrooms: Classroom[]
  /** Aula con el panel de alumnos desplegado (null = ninguno) */
  expandedId: string | null
}>()

const emit = defineEmits<{
  toggle: [classroom: Classroom]
  regenerate: [classroom: Classroom]
  delete: [classroom: Classroom]
}>()
</script>

<template>
  <div class="table-wrap">
    <table id="classrooms-table">
      <thead>
        <tr>
          <th>Aula</th>
          <th>Código</th>
          <th>Alumnos</th>
          <th>Guías</th>
          <th>Creada</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="classroom in classrooms" :key="classroom.id">
          <td>
            <strong>{{ classroom.name }}</strong>
            <span class="hint">Docente: {{ classroom.teacher?.name ?? '—' }}</span>
          </td>
          <td>
            <code v-if="classroom.code" class="code-chip">{{ classroom.code }}</code>
            <span v-else class="muted">—</span>
          </td>
          <td>{{ classroom.memberCount }}</td>
          <td>{{ classroom.guideCount }}</td>
          <td>{{ formatDate(classroom.createdAt) }}</td>
          <td class="row-actions">
            <button
              type="button"
              class="btn btn-small"
              :aria-expanded="expandedId === classroom.id"
              @click="emit('toggle', classroom)"
            >
              {{ expandedId === classroom.id ? 'Ocultar' : 'Alumnos' }}
            </button>
            <button type="button" class="btn btn-small" @click="emit('regenerate', classroom)">
              Regenerar código
            </button>
            <button
              type="button"
              class="btn btn-small btn-danger"
              @click="emit('delete', classroom)"
            >
              Eliminar
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
td strong {
  display: block;
  color: #0f172a;
}

.code-chip {
  font-size: 0.85rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.15rem 0.4rem;
  letter-spacing: 0.06em;
}
</style>
