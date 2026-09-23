<!-- src/layouts/AuthLayout.vue -->
<template>
  <div class="auth-container">
    <div class="auth-card">
      <header class="auth-header">
        <h1>Simulador Educativo</h1>
        <p class="subtitle">Plataforma de gestión de aulas y profesores</p>
      </header>

      <main class="auth-content">
        <!-- El contenido de LoginView.vue se renderizará aquí -->
        <slot />
      </main>

      <footer class="auth-footer">
        <p>&copy; {{ currentYear }} Simulador Web de Electrónica e IoT</p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const currentYear = computed(() => new Date().getFullYear());
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f1f5f9;
  padding: 1.5rem;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.auth-header {
  text-align: center;
}

.auth-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.subtitle {
  font-size: 0.875rem;
  color: #64748b;
}

.auth-content {
  width: 100%;
}

.auth-footer {
  text-align: center;
  font-size: 0.75rem;
  color: #94a3b8;
  border-top: 1px solid #f1f5f9;
  padding-top: 1rem;
}
</style>