<script setup lang="ts">
import { onMounted } from "vue";
import { RouterView } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

onMounted(() => {
  if (localStorage.getItem("auth_token")) {
    void auth.fetchMe();
  }
});
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <nav v-if="auth.isLoggedIn" class="border-b border-amber-900/30 px-6 py-3">
      <div class="max-w-5xl mx-auto flex items-center gap-4">
        <a href="https://proddyt.site" class="flex items-center gap-1.5 font-mono text-xs border border-blue-900/40 text-blue-400 hover:bg-blue-900/20 px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0">
          <span>&lt;·&gt;</span><span>Home</span>
        </a>
        <div class="w-px h-4 bg-amber-900/40 flex-shrink-0" />
        <RouterLink to="/" class="flex items-center gap-2 no-underline flex-shrink-0">
          <span class="font-mono text-base font-medium" style="color: var(--vc-primary)">(·)</span>
          <span class="font-mono text-sm" style="color: var(--vc-muted)">vector</span>
        </RouterLink>
        <div class="flex-1" />
        <div class="flex items-center gap-3 text-sm text-amber-200/70">
          <span>{{ auth.displayName }}</span>
          <button @click="auth.logout()" class="text-red-400 hover:text-red-300">Sair</button>
        </div>
      </div>
    </nav>
    <main class="flex-1">
      <RouterView />
    </main>
  </div>
</template>
