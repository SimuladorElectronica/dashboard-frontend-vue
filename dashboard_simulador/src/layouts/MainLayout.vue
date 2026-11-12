<template>
  <div class="layout-container">
    <!-- Sidebar Navegación -->
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
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const isSidebarClosed = ref(false)
const authStore = useAuthStore()
const router = useRouter()

const toggleSidebar = () => {
  isSidebarClosed.value = !isSidebarClosed.value
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  --sidebar-width: 256px;
  position: relative;
  display: flex;
  min-height: 100vh;
}

/* ------------------------------------------------------------------ Sidebar */
.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  color: #fff;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  transition: margin-left 0.3s ease;
}

.sidebar.is-closed {
  margin-left: calc(-1 * var(--sidebar-width));
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 1.15rem 1.1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 9px;
  background: #2563eb;
  color: #fff;
  box-shadow: 0 8px 16px -8px rgba(37, 99, 235, 0.9);
}

.brand-mark svg {
  width: 18px;
  height: 18px;
}

.brand h2 {
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.25;
  color: #f8fafc;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 1rem 0.75rem;
}

.nav-label {
  padding: 0 0.6rem 0.4rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.62rem 0.75rem;
  border-radius: 8px;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
}

.nav-link svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  opacity: 0.9;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
}

.nav-link.router-link-exact-active {
  background: #2563eb;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 10px 18px -12px rgba(37, 99, 235, 1);
}

.nav-link.router-link-exact-active svg {
  opacity: 1;
}

.nav-link:focus-visible {
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
}

/* --------------------------------------------------------------- Contenido */
.main-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 1.5rem;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid #e2e8f0;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 9px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    transform 0.1s ease;
}

.icon-btn svg {
  width: 20px;
  height: 20px;
}

.icon-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #0f172a;
}

.logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.95rem;
  border-radius: 9px;
  border: 1px solid #fecaca;
  background: #fff;
  color: #b91c1c;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.1s ease;
}

.logout-btn svg {
  width: 16px;
  height: 16px;
}

.logout-btn:hover {
  background: #fef2f2;
  border-color: #fca5a5;
}

.icon-btn:active,
.logout-btn:active {
  transform: translateY(1px);
}

.icon-btn:focus-visible,
.logout-btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.page-body {
  flex: 1;
  width: 100%;
  padding: 1.5rem;
}

@media (max-width: 768px) {
  .sidebar {
    position: absolute;
    z-index: 100;
    height: 100%;
    box-shadow: 0 24px 48px -24px rgba(2, 6, 23, 0.8);
  }

  .topbar {
    padding: 0.65rem 1rem;
  }
}
</style>
