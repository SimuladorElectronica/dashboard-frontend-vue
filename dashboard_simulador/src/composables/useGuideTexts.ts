import { computed, type Ref } from 'vue'

interface GuideTextsOptions {
  /** true = vista docente, false = vista alumno */
  isTeacher: Ref<boolean>
  /** Guía elegida en el filtro de entregas (vacío = todas) */
  studentFilter: Ref<string>
}

/** Textos y mensajes de la página de Guías, según el rol de la sesión */
export function useGuideTexts({ isTeacher, studentFilter }: GuideTextsOptions) {
  const listTitle = computed(() => (isTeacher.value ? 'Mis guías' : 'Guías disponibles'))

  const submissionsTitle = computed(() =>
    isTeacher.value ? 'Alumnos inscritos' : 'Mis entregas',
  )

  const subtitle = computed(() =>
    isTeacher.value
      ? 'Creá consignas por aula vinculando un circuito de plantilla y seguí las entregas de tus alumnos. Tocá una guía para abrir su plantilla en el simulador.'
      : 'Consultá tus entregas y abrí el circuito plantilla de cada guía en el simulador.',
  )

  const emptyGuidesMessage = computed(() =>
    isTeacher.value
      ? 'Todavía no creaste guías. Usá el formulario para crear la primera.'
      : 'No hay guías disponibles todavía.',
  )

  const emptySubmissionsMessage = computed(() => {
    const scope = studentFilter.value ? 'esta guía' : isTeacher.value ? 'tus guías' : 'ninguna guía'
    return isTeacher.value
      ? `Ningún alumno entregó todavía en ${scope}.`
      : `Todavía no entregaste en ${scope}.`
  })

  return {
    listTitle,
    submissionsTitle,
    subtitle,
    emptyGuidesMessage,
    emptySubmissionsMessage,
  }
}
