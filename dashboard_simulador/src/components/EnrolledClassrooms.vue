<script setup lang="ts">
import { computed } from 'vue'
import { formatDate } from '@/utils/format'
import type { Classroom, Guide } from '@/services/types'

const props = defineProps<{
  classrooms: Classroom[]
  guides: Guide[]
}>()

const emit = defineEmits<{
  leave: [classroom: Classroom]
}>()

/** Guías visibles agrupadas por aula (solo alumno) */
const guidesByClassroom = computed<Record<string, Guide[]>>(() => {
  const map: Record<string, Guide[]> = {}
  for (const guide of props.guides) {
    const list = map[guide.classroomId] ?? (map[guide.classroomId] = [])
    list.push(guide)
  }
  return map
})
</script>

<template>
  <div class="aula-list">
    <article v-for="classroom in classrooms" :key="classroom.id" class="aula-block">
      <div class="aula-block-head">
        <div>
          <h3>{{ classroom.name }}</h3>
          <p class="hint">
            Docente: {{ classroom.teacher?.name ?? '—' }} · {{ classroom.memberCount }}
            {{ classroom.memberCount === 1 ? 'alumno' : 'alumnos' }} ·
            {{ classroom.guideCount }} {{ classroom.guideCount === 1 ? 'guía' : 'guías' }}
          </p>
        </div>
        <button type="button" class="btn btn-small btn-danger" @click="emit('leave', classroom)">
          Dejar el aula
        </button>
      </div>

      <ul class="guide-list">
        <li
          v-for="guide in guidesByClassroom[classroom.id] ?? []"
          :key="guide.id"
          class="guide-row"
        >
          <span>
            <strong>{{ guide.title }}</strong>
            <span class="hint">Creada: {{ formatDate(guide.createdAt) }}</span>
          </span>
        </li>
        <li v-if="(guidesByClassroom[classroom.id]?.length ?? 0) === 0" class="muted guide-row">
          El docente todavía no publicó guías en esta aula.
        </li>
      </ul>
    </article>

    <p class="muted aula-list-footer">
      Entregá las guías desde
      <router-link to="/guias">Guías Prácticas</router-link>.
    </p>
  </div>
</template>

<style scoped>
.aula-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.aula-block {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
  background: #f8fafc;
}

.aula-block-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.6rem;
}

.aula-block-head h3 {
  font-size: 1rem;
  color: #0f172a;
  margin-bottom: 0.2rem;
}

.guide-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 0.6rem;
}

.guide-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #0f172a;
}

.aula-list-footer {
  margin: 0;
}
</style>
