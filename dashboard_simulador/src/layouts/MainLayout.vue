<template>
  <div class="layout-container">
    <MainSidebar :is-sidebar-closed="isSidebarClosed" />

    <!-- Contenido Principal -->
    <div class="main-content">
      <header class="topbar">
        <button
          type="button"
          class="icon-btn"
          aria-label="Mostrar u ocultar el menú lateral"
          title="Mostrar u ocultar el menú"
          @click="toggleSidebar"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <a
          :href="newProjectUrl"
          target="_blank"
          rel="noopener"
          class="new-project-btn"
          title="Abre el simulador con tu cuenta y un lienzo vacío"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Nuevo proyecto</span>
        </a>

        <button type="button" class="logout-btn" @click="handleLogout">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          <span>Cerrar Sesión</span>
        </button>
      </header>

      <main class="page-body">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { simulatorNewProjectUrl } from '@/services/simulatorLink'
import { useRouter } from 'vue-router'
import MainSidebar from '@/components/MainSidebar.vue'

const isSidebarClosed = ref(false)
const authStore = useAuthStore()
const router = useRouter()

// "Nuevo proyecto": abre el simulador con la sesión de la cuenta y el lienzo en blanco
const newProjectUrl = computed(() => simulatorNewProjectUrl(authStore.token))

const toggleSidebar = () => {
  isSidebarClosed.value = !isSidebarClosed.value
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>
