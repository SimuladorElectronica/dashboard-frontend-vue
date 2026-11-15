<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAulasData } from '@/composables/useAulasData'
import { useClassroomStudents } from '@/composables/useClassroomStudents'
import { useClassroomActions } from '@/composables/useClassroomActions'
import ClassroomCreatePanel from '@/components/ClassroomCreatePanel.vue'
import ClassroomJoinPanel from '@/components/ClassroomJoinPanel.vue'
import ClassroomsTable from '@/components/ClassroomsTable.vue'
import EnrolledClassrooms from '@/components/EnrolledClassrooms.vue'
import ClassroomStudentsPanel from '@/components/ClassroomStudentsPanel.vue'

const {
  loading,
  listError,
  currentUser,
  classrooms,
  guides,
  isTeacher,
  isStudent,
  refreshAll,
  reloadAll,
  loadClassrooms,
} = useAulasData()

const notice = ref('')

const {
  expandedClassroomId,
  students,
  studentsLoading,
  studentsError,
  toggleStudents,
  collapseIf,
  onRemoveStudent,
} = useClassroomStudents({ notify: (message) => (notice.value = message) })

/** Aula actualmente expandida (para el panel de alumnos) */
const expandedClassroom = computed(
  () => classrooms.value.find((c) => c.id === expandedClassroomId.value) ?? null,
)

const {
  onCreated,
  onJoined,
  onRegenerateCode,
  onDeleteClassroom,
  onLeave,
  onRemoveStudentClick,
} = useClassroomActions({
  currentUser,
  listError,
  notice,
  expandedClassroom,
  reloadAll,
  loadClassrooms,
  collapseIf,
  onRemoveStudent,
})

const subtitle = computed(() =>
  isTeacher.value
    ? 'Creá aulas, compartí el código de unión con tus alumnos y administrá las inscripciones.'
    : 'Tus aulas inscriptas y las guías de cada una.',
)

const emptyListMessage = computed(() =>
  isTeacher.value
    ? 'Todavía no creaste aulas. Usá el formulario para crear la primera.'
    : 'Todavía no te uniste a ninguna aula.',
)

onMounted(refreshAll)
</script>

<template>
  <div class="aulas-page">
    <header class="page-header">
      <div>
        <h1>Gestión de Aulas</h1>
        <p class="subtitle">{{ subtitle }}</p>
      </div>
      <button type="button" class="btn btn-ghost" :disabled="loading" @click="refreshAll">
        {{ loading ? 'Actualizando…' : 'Actualizar' }}
      </button>
    </header>

    <p v-if="notice" class="notice" role="status">{{ notice }}</p>

    <div class="grid" :class="{ 'grid--single': !isTeacher }">
      <!-- Crear aula (solo docente): genera el código de unión -->
      <ClassroomCreatePanel v-if="isTeacher" @created="onCreated" />

      <!-- Unirme a un aula (solo alumno): código de 6 caracteres -->
      <ClassroomJoinPanel v-if="isStudent" @joined="onJoined" />

      <!-- Listado de aulas -->
      <section class="card" aria-labelledby="classrooms-list-title">
        <div class="card-header">
          <h2 id="classrooms-list-title">
            {{ isTeacher ? 'Mis aulas' : 'Mis aulas inscriptas' }}
          </h2>
          <span class="badge">{{ classrooms.length }}</span>
        </div>

        <p v-if="listError" class="error" role="alert">{{ listError }}</p>
        <p v-else-if="loading" class="muted">Cargando aulas…</p>
        <p v-else-if="classrooms.length === 0" class="muted">{{ emptyListMessage }}</p>
        <p v-else-if="!isTeacher && !isStudent" class="muted">
          La vista de administración de aulas está fuera del alcance por ahora.
        </p>

        <!-- Tabla del docente -->
        <ClassroomsTable
          v-else-if="isTeacher"
          :classrooms="classrooms"
          :expanded-id="expandedClassroomId"
          @toggle="toggleStudents"
          @regenerate="onRegenerateCode"
          @delete="onDeleteClassroom"
        />

        <!-- Aulas del alumno, cada una con sus guías visibles -->
        <EnrolledClassrooms
          v-else-if="isStudent"
          :classrooms="classrooms"
          :guides="guides"
          @leave="onLeave"
        />

        <!-- Alumnos inscriptos del aula expandida (solo docente) -->
        <ClassroomStudentsPanel
          v-if="isTeacher && expandedClassroom"
          :classroom="expandedClassroom"
          :students="students"
          :loading="studentsLoading"
          :error="studentsError"
          @remove="onRemoveStudentClick"
        />
      </section>
    </div>
  </div>
</template>

<style scoped>
.aulas-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
</style>
