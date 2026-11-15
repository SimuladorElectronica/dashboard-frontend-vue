<script setup lang="ts">
import { formatDate } from '@/utils/format'
import { simulatorProjectUrl } from '@/services/simulatorLink'
import type { Submission } from '@/services/types'

defineProps<{
  submissions: Submission[]
}>()
</script>

<template>
  <section class="card" aria-labelledby="recent-submissions-title">
    <h2 id="recent-submissions-title">Últimas entregas de tus alumnos</h2>

    <p v-if="submissions.length === 0" class="muted">
      Todavía no recibiste entregas en tus guías.
    </p>
    <div v-else class="table-wrap">
      <table class="submissions-table">
        <thead>
          <tr>
            <th>Alumno</th>
            <th>Guía</th>
            <th>Proyecto entregado</th>
            <th>Entregado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="submission in submissions" :key="submission.id">
            <td>{{ submission.student?.name ?? '—' }}</td>
            <td>{{ submission.guide?.title ?? '—' }}</td>
            <td>
              <span>{{ submission.project?.title ?? '—' }}</span>
              <code v-if="submission.project" class="slug">
                /share/{{ submission.project.shareSlug }}
              </code>
            </td>
            <td>
              <time :datetime="submission.submittedAt">
                {{ formatDate(submission.submittedAt) }}
              </time>
            </td>
            <td>
              <a
                :href="simulatorProjectUrl(submission.project?.shareSlug || '')"
                target="_blank"
                rel="noopener"
                class="btn btn-small btn-primary"
              >
                Abrir ↗
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="card-footer">
      <router-link to="/guias">Ver todas las entregas →</router-link>
    </p>
  </section>
</template>
