<script setup lang="ts">
import { formatDateTime } from '@/utils/format'
import { simulatorProjectUrl } from '@/services/simulatorLink'
import type { Guide, Submission } from '@/services/types'

defineProps<{
  submissions: Submission[]
  submissionsTotal: number
  loading: boolean
  guides: Guide[]
  /** Guía elegida en el filtro (vacío = todas) */
  studentFilter: string
  title: string
  emptyMessage: string
  isTeacher: boolean
}>()

const emit = defineEmits<{
  'update:studentFilter': [guideId: string]
  filterChange: []
}>()

function onFilterChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  emit('update:studentFilter', value)
  emit('filterChange')
}

/** Clic en una entrega: abre el estado guardado en el simulador React */
function openInSimulator(submission: Submission): void {
  if (!submission.project) return
  window.open(simulatorProjectUrl(submission.project.shareSlug), '_blank', 'noopener')
}
</script>

<template>
  <section class="card" aria-labelledby="students-title">
    <div class="card-header">
      <h2 id="students-title">{{ title }}</h2>
      <div class="filters">
        <label class="sr-only" for="guide-filter">Filtrar por guía</label>
        <select id="guide-filter" :value="studentFilter" @change="onFilterChange">
          <option value="">Todas las guías</option>
          <option v-for="guide in guides" :key="guide.id" :value="guide.id">
            {{ guide.title }} · {{ guide.classroom?.name ?? '' }}
          </option>
        </select>
        <span class="badge">{{ submissionsTotal }}</span>
      </div>
    </div>

    <p v-if="loading" class="muted">Cargando entregas…</p>
    <p v-else-if="submissions.length === 0" class="muted">{{ emptyMessage }}</p>

    <div v-else class="table-wrap">
      <table id="submissions-table">
        <thead>
          <tr>
            <th v-if="isTeacher">Alumno</th>
            <th v-if="isTeacher">Correo</th>
            <th>Guía</th>
            <th>Proyecto entregado</th>
            <th>Entregado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="submission in submissions"
            :key="submission.id"
            class="clickable-row"
            title="Abrir en el simulador"
            @click="openInSimulator(submission)"
          >
            <td v-if="isTeacher">{{ submission.student?.name ?? 'Alumno sin nombre' }}</td>
            <td v-if="isTeacher">{{ submission.student?.email ?? '—' }}</td>
            <td>{{ submission.guide?.title ?? '—' }}</td>
            <td>
              <span>{{ submission.project?.title ?? '—' }}</span>
              <code v-if="submission.project" class="slug">
                /share/{{ submission.project.shareSlug }}
              </code>
            </td>
            <td>
              <time :datetime="submission.submittedAt">
                {{ formatDateTime(submission.submittedAt) }}
              </time>
            </td>
            <td class="row-actions">
              <a
                v-if="submission.project"
                class="btn btn-small btn-link"
                :href="simulatorProjectUrl(submission.project.shareSlug)"
                target="_blank"
                rel="noopener"
                @click.stop
              >
                Abrir ↗
              </a>
              <span v-else class="muted">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
