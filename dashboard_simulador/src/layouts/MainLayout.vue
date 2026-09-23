<template>
  <div class="layout-container">
    <!-- Sidebar Navegación -->
    <aside :class="['sidebar', { 'is-closed': isSidebarClosed }]">
      <div class="brand">
        <h2>Simulador Educativo</h2>
      </div>
      <nav>
        <router-link to="/">Dashboard</router-link>
        <router-link to="/aulas">Gestión de Aulas</router-link>
      </nav>
    </aside>

    <!-- Contenido Principal -->
    <div class="main-content">
      <header class="topbar">
        <button @click="toggleSidebar" class="toggle-btn">☰</button>
        <button @click="handleLogout" class="logout-btn">Cerrar Sesión</button>
      </header>

      <main class="page-body">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { useAuthStore } from '@/stores/auth';
    import { useRouter } from 'vue-router';

    const isSidebarClosed = ref(false);
    const authStore = useAuthStore();
    const router = useRouter();

    const toggleSidebar = () => {
    isSidebarClosed.value = !isSidebarClosed.value;
    };

    const handleLogout = () => {
    authStore.logout();
    router.push('/login');
    };
</script>

<style scoped>
    .layout-container {
    display: flex;
    min-height: 100vh;
    }
    .sidebar {
    width: 240px;
    background-color: #1e293b;
    color: #fff;
    transition: margin-left 0.3s ease;
    }
    .sidebar.is-closed {
    margin-left: -240px;
    }
    .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    }
    .topbar {
    display: flex;
    justify-content: space-between;
    padding: 1rem;
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    }
    .page-body {
    padding: 1.5rem;
    flex: 1;
    }
    @media (max-width: 768px) {
    .sidebar {
        position: absolute;
        z-index: 100;
        height: 100%;
    }
    }
</style>