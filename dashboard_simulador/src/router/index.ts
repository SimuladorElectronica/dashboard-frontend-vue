import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false, layout: 'AuthLayout' },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/Register.vue'),
      meta: { requiresAuth: false, layout: 'AuthLayout' },
    },
    {
      path: '/auth/token',
      name: 'token-login',
      // Entrada rápida desde el simulador: llega el access_token por
      // query param (?access_token=…) o por hash (#access_token=…)
      component: () => import('@/views/TokenLogin.vue'),
      meta: { requiresAuth: false, layout: 'AuthLayout' },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { requiresAuth: true, layout: 'MainLayout' },
    },
    {
      path: '/aulas',
      name: 'aulas',
      component: () => import('@/views/Aulas.vue'),
      meta: { requiresAuth: true, layout: 'MainLayout' },
    },
    {
      path: '/guias',
      name: 'guias',
      component: () => import('@/views/Guides.vue'),
      meta: { requiresAuth: true, layout: 'MainLayout' },
    },
    {
      path: '/proyectos',
      name: 'proyectos',
      component: () => import('@/views/Projects.vue'),
      meta: { requiresAuth: true, layout: 'MainLayout' },
    },
  ],
})

// Guard de Navegación JWT
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
  } else if ((to.name === 'login' || to.name === 'register') && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
