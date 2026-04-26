import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore, buildAuthorizeUrl } from "@/stores/auth";
import AuthCallback from "@/views/AuthCallback.vue";
import ProjectList from "@/views/ProjectList.vue";
import ProjectView from "@/views/ProjectView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/auth/callback", name: "callback", component: AuthCallback, meta: { guest: true } },
    { path: "/", name: "projects", component: ProjectList, meta: { requiresAuth: true } },
    { path: "/projects/:id", name: "project", component: ProjectView, meta: { requiresAuth: true } },
  ],
});

router.beforeEach((to) => {
  if (to.meta.guest) return true;
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    window.location.href = buildAuthorizeUrl();
    return false;
  }
  return true;
});

export default router;
