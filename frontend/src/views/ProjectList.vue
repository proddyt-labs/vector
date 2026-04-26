<template>
  <div class="max-w-3xl mx-auto px-6 py-10">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold text-amber-50">Projetos</h1>
      <button @click="showCreate = true" class="text-sm px-3 py-1.5 rounded-lg border border-amber-800/60 text-amber-300 hover:bg-amber-900/20 transition-colors">
        + Novo projeto
      </button>
    </div>

    <div v-if="loading" class="text-amber-300/50 text-sm">Carregando...</div>
    <div v-else-if="!projects.length" class="text-amber-300/50 text-sm">Nenhum projeto. Crie um para começar.</div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <RouterLink
        v-for="p in projects" :key="p.id"
        :to="`/projects/${p.id}`"
        class="block px-4 py-4 rounded-xl border border-amber-900/30 bg-amber-950/10 hover:bg-amber-900/20 transition-colors"
      >
        <div class="font-medium text-amber-100 mb-1">{{ p.name }}</div>
        <div v-if="p.description" class="text-xs text-amber-400/60 mb-3 truncate">{{ p.description }}</div>
        <div class="text-xs text-amber-400/50">{{ p.taskCount }} tasks</div>
      </RouterLink>
    </div>

    <!-- Create modal -->
    <div v-if="showCreate" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="showCreate = false">
      <div class="bg-[#221800] border border-amber-900/40 rounded-2xl p-6 w-80">
        <h2 class="text-base font-semibold text-amber-100 mb-4">Novo projeto</h2>
        <input v-model="form.name" type="text" placeholder="Nome do projeto"
          class="w-full bg-amber-950/40 border border-amber-800/40 rounded-lg px-3 py-2 text-sm text-amber-50 placeholder-amber-400/40 focus:outline-none focus:border-amber-500 mb-2"
          @keyup.enter="create"
        />
        <input v-model="form.description" type="text" placeholder="Descrição (opcional)"
          class="w-full bg-amber-950/40 border border-amber-800/40 rounded-lg px-3 py-2 text-sm text-amber-50 placeholder-amber-400/40 focus:outline-none focus:border-amber-500 mb-3"
        />
        <div v-if="createError" class="text-red-400 text-xs mb-2">{{ createError }}</div>
        <div class="flex gap-2">
          <button @click="showCreate = false" class="flex-1 text-sm py-1.5 rounded-lg border border-amber-900/40 text-amber-400 hover:bg-amber-900/20 transition-colors">Cancelar</button>
          <button @click="create" :disabled="creating" class="flex-1 text-sm py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-black transition-colors disabled:opacity-50">
            {{ creating ? '...' : 'Criar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { api } from '@/lib/api'

interface Project { id: string; name: string; description: string | null; taskCount: number }

const projects = ref<Project[]>([])
const loading = ref(true)
const showCreate = ref(false)
const form = ref({ name: '', description: '' })
const creating = ref(false)
const createError = ref('')
const router = useRouter()

async function load() {
  loading.value = true
  try {
    const { data } = await api.get<Project[]>('/projects')
    projects.value = data
  } finally {
    loading.value = false
  }
}

async function create() {
  if (!form.value.name.trim()) return
  creating.value = true
  createError.value = ''
  try {
    const { data } = await api.post<{ id: string }>('/projects', form.value)
    showCreate.value = false
    form.value = { name: '', description: '' }
    router.push(`/projects/${data.id}`)
  } catch (e: any) {
    createError.value = e.response?.data?.error ?? 'Erro ao criar projeto'
  } finally {
    creating.value = false
  }
}

onMounted(load)
</script>
