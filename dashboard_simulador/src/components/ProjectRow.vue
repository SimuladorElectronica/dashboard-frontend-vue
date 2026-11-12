<script setup lang="ts">
import { computed } from 'vue'
import { formatDate, formatDateTime } from '@/utils/format'
import { simulatorProjectUrl, simulatorTemplateUrl } from '@/services/simulatorLink'
import { canManageTemplate } from '@/utils/permissions'
import type { AuthUser, ProjectSummary } from '@/services/types'

const props = defineProps<{
  project: ProjectSummary
  currentUser: AuthUser | null
  /** true mientras se está guardando el estado de plantilla de ESTE proyecto */
  pending: boolean
}>()

const emit = defineEmits<{
  toggleTemplate: [project: ProjectSummary]
  copyLink: [project: ProjectSummary]
}>()

const canManageTemplateForRow = computed(() => canManageTemplate(props.currentUser, props.project))

/** Clic en la fila: abre el circuito en el simulador React */
function openInSimulator(): void {
  window.open(simulatorProjectUrl(props.project.shareSlug), '_blank', 'noopener')
}
</script>

<template>
  <tr
    class="clickable-row"
    title="Abrir en el simulador"
    @click="openInSimulator"
  >
    <td>
      <strong>{{ project.title }}</strong>
      <span v-if="project.description" class="description">{{ project.description }}</span>
    </td>
    <td>
      <code class="slug">/share/{{ project.shareSlug }}</code>
    </td>
    <td>
      <span
        class="visibility"
        :class="project.isPublic ? 'visibility--public' : 'visibility--private'"
      >
        {{ project.isPublic ? 'Público' : 'Privado' }}
      </span>
      <span v-if="project.isTemplate" class="template-pill">Plantilla</span>
    </td>
    <td>{{ formatDate(project.createdAt) }}</td>
    <td>
      <time :datetime="project.updatedAt">{{ formatDateTime(project.updatedAt) }}</time>
    </td>
    <td class="row-actions">
      <button
        v-if="canManageTemplateForRow"
        type="button"
        class="btn btn-small template-toggle"
        :class="{ 'template-toggle--on': project.isTemplate }"
        :aria-pressed="project.isTemplate"
        :disabled="pending"
        :title="
          project.isTemplate ? 'Quitar el estado de plantilla' : 'Marcar como plantilla pública del simulador'
        "
        @click.stop="emit('toggleTemplate', project)"
      >
        {{ pending ? 'Guardando…' : project.isTemplate ? 'Plantilla ✓' : 'Plantilla' }}
      </button>
      <template v-if="project.isTemplate">
        <a
          class="btn btn-small btn-link"
          :href="simulatorTemplateUrl(project.shareSlug)"
          target="_blank"
          rel="noopener"
          title="Abrir como invitado en el simulador (sin sesión)"
          @click.stop
        >
          Plantilla ↗
        </a>
        <button
          type="button"
          class="btn btn-small"
          title="Copiar el enlace público de la plantilla"
          @click.stop="emit('copyLink', project)"
        >
          Copiar enlace
        </button>
      </template>
      <a
        class="btn btn-small btn-link"
        :href="simulatorProjectUrl(project.shareSlug)"
        target="_blank"
        rel="noopener"
        @click.stop
      >
        Abrir ↗
      </a>
    </td>
  </tr>
</template>

<style scoped>
td strong {
  display: block;
  color: #0f172a;
}

.description {
  display: block;
  color: #64748b;
  font-size: 0.8rem;
  margin-top: 0.15rem;
  max-width: 42ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.visibility {
  display: inline-block;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.55rem;
}

.visibility--public {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.visibility--private {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.template-pill {
  display: inline-block;
  margin-left: 0.35rem;
  background: #eef2ff;
  color: #4338ca;
  border: 1px solid #c7d2fe;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.55rem;
}

/* Toggle de plantilla: visible solo para ADMIN y para el TEACHER dueño */
.template-toggle--on {
  background: #eef2ff;
  border-color: #a5b4fc;
  color: #4338ca;
}

.template-toggle--on:hover:not(:disabled) {
  background: #e0e7ff;
}
</style>
