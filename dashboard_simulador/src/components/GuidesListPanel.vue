<script setup lang="ts">
import { formatDate } from '@/utils/format'
import { simulatorProjectUrl } from '@/services/simulatorLink'
import type { Classroom, Guide } from '@/services/types'

defineProps<{
  guides: Guide[]
  loading: boolean
  listError: string
  classrooms: Classroom[]
  classroomFilter: string
  /** La guía seleccionada para entregar (la resalta el docente/alumno) */
  studentFilter: string
  listTitle: string
  emptyMessage: string
  isTeacher: boolean
}>()

const emit = defineEmits<{
  /** El docente pidió editar la guía (el padre abre el formulario) */
  edit: [guide: Guide]
  /** El docente pidió eliminar la guía (el padre confirma y borra) */
  remove: [guide: Guide]
  'update:classroomFilter': [classroomId: string]
  filterChange: []
}>()

/** Clic en una guía: abre su circuito plantilla en el simulador React */
function openGuideInSimulator(guide: Guide): void {
  if (!guide.starterProject?.shareSlug) return
  window.open(simulatorProjectUrl(guide.starterProject.shareSlug), '_blank', 'noopener')
}

function onFilterChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  emit('update:classroomFilter', value)
  emit('filterChange')
}
</script>

<template>
  <section class="card" aria-labelledby="list-title">
    <div class="card-header">
      <h2 id="list-title">{{ listTitle }}</h2>
      <div class="filters">
        <label class="sr-only" for="classroom-filter">Filtrar por aula</label>
        <select id="classroom-filter" :value="classroomFilter" @change="onFilterChange">
          <option value="">Todas las aulas</option>
          <option v-for="classroom in classrooms" :key="classroom.id" :value="classroom.id">
            {{ classroom.name }}
          </option>
        </select>
        <span class="badge">{{ guides.length }}</span>
      </div>
    </div>

    <p v-if="listError" class="error" role="alert">{{ listError }}</p>
    <p v-else-if="loading" class="muted">Cargando guías…</p>
    <p v-else-if="guides.length === 0" class="muted">{{ emptyMessage }}</p>

    <div v-else class="table-wrap">
      <table id="guides-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Aula</th>
            <th>Circuito plantilla</th>
            <th>Creada</th>
            <th v-if="isTeacher">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="guide in guides"
            :key="guide.id"
            class="clickable-row"
            :class="{ 'is-selected': guide.id === studentFilter }"
            title="Abrir la guía plantilla en el simulador"
            @click="openGuideInSimulator(guide)"
          >
            <td>
              <strong>{{ guide.title }}</strong>
            </td>
            <td>{{ guide.classroom?.name ?? '—' }}</td>
            <td>
              <span>{{ guide.starterProject.title }}</span>
              <a
                class="template-link"
                :href="simulatorProjectUrl(guide.starterProject.shareSlug)"
                target="_blank"
                rel="noopener"
                :title="`Abrir ${guide.starterProject.title} en el simulador`"
                @click.stop
              >
                <code class="slug">/share/{{ guide.starterProject.shareSlug }}</code>
                <span aria-hidden="true">↗</span>
              </a>
            </td>
            <td>{{ formatDate(guide.createdAt) }}</td>
            <td v-if="isTeacher" class="row-actions">
              <button type="button" class="btn btn-small" @click.stop="emit('edit', guide)">
                Editar
              </button>
              <button
                type="button"
                class="btn btn-small btn-danger"
                @click.stop="emit('remove', guide)"
              >
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
td strong {
  display: block;
  color: #0f172a;
}

/* Enlace al circuito plantilla: el clic abre el simulador y no
   selecciona la fila (evita duplicar la acción) */
.template-link {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  color: #64748b;
  font-size: 0.8rem;
  text-decoration: none;
}

.template-link:hover .slug {
  background: #e2e8f0;
  color: #334155;
}
</style>
