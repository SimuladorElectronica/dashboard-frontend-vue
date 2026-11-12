<template>
  <!-- Sidebar de navegación -->
  <aside :class="['sidebar', { 'is-closed': isSidebarClosed }]">
    <div class="brand">
      <span class="brand-mark" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="7" y="7" width="10" height="10" rx="2" />
          <path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4" />
        </svg>
      </span>
      <h2>Simulador Educativo</h2>
    </div>

    <nav aria-label="Navegación principal">
      <span class="nav-label">Menú</span>

      <router-link to="/" class="nav-link">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
        </svg>
        <span>Dashboard</span>
      </router-link>

      <router-link to="/aulas" class="nav-link">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M15.5 19.5v-1.7a3.3 3.3 0 0 0-3.3-3.3H6.8A3.3 3.3 0 0 0 3.5 17.8v1.7" />
          <circle cx="9.5" cy="7.8" r="3.3" />
          <path d="M20.5 19.5v-1.7a3.3 3.3 0 0 0-2.5-3.2" />
          <path d="M15.5 4.7a3.3 3.3 0 0 1 0 6.2" />
        </svg>
        <span>Gestión de Aulas</span>
      </router-link>

      <router-link to="/guias" class="nav-link">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path
            d="M13.5 3.5H7A1.5 1.5 0 0 0 5.5 5v14a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V8.5z"
          />
          <path d="M13.5 3.5v5h5" />
          <path d="M8.5 13h7M8.5 16.5h4.5" />
        </svg>
        <span>Guías Prácticas</span>
      </router-link>

      <router-link to="/proyectos" class="nav-link">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4.5" width="18" height="14.5" rx="2" />
          <path d="M3 9h18" />
          <path d="M7 6.75h.01M9.75 6.75h.01" />
          <path d="M7.5 13.5l2.2-2.2 2 2 2.6-3.1 2.2 3.3" />
        </svg>
        <span>Mis Proyectos</span>
      </router-link>
    </nav>
  </aside>
</template>

<script setup lang="ts">
defineProps<{
  isSidebarClosed: boolean
}>()
</script>
