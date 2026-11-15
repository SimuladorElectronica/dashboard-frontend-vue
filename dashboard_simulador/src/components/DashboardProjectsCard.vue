<script setup lang="ts">
import { formatDate } from '@/utils/format'
import { simulatorProjectUrl } from '@/services/simulatorLink'
import type { ProjectSummary } from '@/services/types'

defineProps<{
  projects: ProjectSummary[]
}>()
</script>

<template>
  <section class="card" aria-labelledby="recent-projects-title">
    <h2 id="recent-projects-title">Tus proyectos recientes</h2>

    <p v-if="projects.length === 0" class="muted">Aún no trabajaste en ningún proyecto.</p>
    <div v-else class="stack-list">
      <div v-for="project in projects" :key="project.id" class="list-row">
        <div class="list-info">
          <strong>{{ project.title }}</strong>
          <span class="hint">
            {{ project.description ?? 'Sin descripción' }} ·
            {{ project.isPublic ? 'Público' : 'Privado' }}
          </span>
        </div>
        <span
          class="visibility"
          :class="project.isPublic ? 'visibility--public' : 'visibility--private'"
        >
          {{ project.isPublic ? 'Público' : 'Privado' }}
        </span>
        <time :datetime="project.updatedAt">{{ formatDate(project.updatedAt) }}</time>
        <a
          :href="simulatorProjectUrl(project.shareSlug)"
          target="_blank"
          rel="noopener"
          class="btn btn-small btn-primary"
        >
          Abrir ↗
        </a>
      </div>
    </div>

    <p class="card-footer">
      <router-link to="/proyectos">Ver todos tus proyectos →</router-link>
    </p>
  </section>
</template>
