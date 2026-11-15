<script setup lang="ts">
import { formatDate } from '@/utils/format'
import type { Guide } from '@/services/types'

defineProps<{
  guides: Guide[]
}>()
</script>

<template>
  <section class="card" aria-labelledby="recent-guides-title">
    <h2 id="recent-guides-title">Últimas guías en tus aulas</h2>

    <p v-if="guides.length === 0" class="muted">
      No hay guías nuevas en las aulas en las que estás inscripto.
    </p>
    <ul v-else class="stack-list">
      <li v-for="guide in guides" :key="guide.id" class="list-row">
        <div class="list-info">
          <strong>{{ guide.title }}</strong>
          <span class="hint">
            Aula: {{ guide.classroom?.name }} · {{ formatDate(guide.createdAt) }}
          </span>
        </div>
        <router-link to="/guias" class="btn btn-small">Ver guía</router-link>
      </li>
    </ul>

    <p class="card-footer">
      <router-link to="/guias">Ver todas las guías →</router-link>
    </p>
  </section>
</template>
