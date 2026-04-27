import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/imprint',
      name: 'imprint',
      component: () => import('../views/ImprintView.vue')
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('../views/PrivacyView.vue')
    },
    {
      path: '/management',
      name: 'cms-dashboard',
      component: () => import('../views/cms/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/management/login',
      name: 'cms-login',
      component: () => import('../views/cms/LoginView.vue')
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  if (!authStore.initialized) {
    await authStore.checkSession()
  }

  if (to.meta.requiresAuth && !authStore.user) {
    next({ name: 'cms-login' })
  } else if (to.name === 'cms-login' && authStore.user) {
    next({ name: 'cms-dashboard' })
  } else {
    next()
  }
})

export default router
