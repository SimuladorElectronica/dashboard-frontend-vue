<script setup lang="ts">
import { formatDate } from '@/utils/format'
import type { Classroom, ClassroomStudent } from '@/services/types'

defineProps<{
  /** Aula desplegada (el panel solo existe con un aula expandida) */
  classroom: Classroom
  students: ClassroomStudent[]
  loading: boolean
  error: string
}>()

const emit = defineEmits<{
  remove: [student: ClassroomStudent]
}>()
</script>

<template>
  <div class="students-panel">
    <div class="card-header">
      <h3>Alumnos inscriptos</h3>
      <span class="badge">{{ students.length }}</span>
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-else-if="loading" class="muted">Cargando alumnos…</p>
    <p v-else-if="students.length === 0" class="muted">
      Todavía no hay alumnos inscriptos en esta aula.
    </p>

    <table v-else id="classroom-students-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Correo</th>
          <th>Inscripto</th>
          <th>Quitar</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="student in students" :key="student.id">
          <td>{{ student.name }}</td>
          <td>{{ student.email }}</td>
          <td>{{ formatDate(student.joinedAt) }}</td>
          <td>
            <button
              type="button"
              class="btn btn-small btn-danger"
              @click="emit('remove', student)"
            >
              Quitar
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.students-panel {
  margin-top: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem;
  background: #f8fafc;
}

.students-panel h3 {
  font-size: 0.95rem;
  color: #0f172a;
}
</style>
