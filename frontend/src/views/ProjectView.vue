<template>
  <div class="flex flex-col h-screen">
    <!-- Header -->
    <div class="border-b border-amber-900/30 px-6 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <RouterLink to="/" class="text-amber-400/60 hover:text-amber-300 text-sm transition-colors">← projetos</RouterLink>
        <span class="text-amber-100 font-medium">{{ projectName }}</span>
      </div>
      <button @click="showCreate = true" class="text-xs px-2.5 py-1 rounded-lg border border-amber-800/50 text-amber-300 hover:bg-amber-900/20 transition-colors">
        + Task
      </button>
    </div>

    <!-- Kanban board -->
    <div class="flex-1 overflow-x-auto px-6 py-5">
      <div class="flex gap-4 h-full min-w-max">
        <div v-for="col in columns" :key="col.status" class="w-64 flex flex-col">
          <div class="text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-2" :class="col.labelClass">
            <span>{{ col.label }}</span>
            <span class="font-mono text-amber-400/40">{{ tasksByStatus(col.status).length }}</span>
          </div>

          <div class="flex flex-col gap-2 flex-1">
            <div
              v-for="task in tasksByStatus(col.status)" :key="task.id"
              class="px-3 py-2.5 rounded-xl border border-amber-900/25 bg-amber-950/15 text-sm text-amber-100"
            >
              <div class="mb-2">{{ task.title }}</div>
              <div v-if="task.description" class="text-xs text-amber-400/50 mb-2">{{ task.description }}</div>
              <div class="flex gap-1 flex-wrap">
                <button
                  v-for="s in nextStatuses(col.status)" :key="s.status"
                  @click="updateStatus(task.id, s.status)"
                  class="text-xs px-2 py-0.5 rounded border transition-colors"
                  :class="s.btnClass"
                >
                  {{ s.label }}
                </button>
              </div>
            </div>

            <div v-if="!tasksByStatus(col.status).length" class="text-xs text-amber-400/20 text-center py-4">
              vazio
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create task modal -->
    <div v-if="showCreate" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="showCreate = false">
      <div class="bg-[#221800] border border-amber-900/40 rounded-2xl p-6 w-80">
        <h2 class="text-base font-semibold text-amber-100 mb-4">Nova task</h2>
        <input v-model="newTask.title" type="text" placeholder="Título"
          class="w-full bg-amber-950/40 border border-amber-800/40 rounded-lg px-3 py-2 text-sm text-amber-50 placeholder-amber-400/40 focus:outline-none focus:border-amber-500 mb-2"
          @keyup.enter="createTask"
        />
        <input v-model="newTask.description" type="text" placeholder="Descrição (opcional)"
          class="w-full bg-amber-950/40 border border-amber-800/40 rounded-lg px-3 py-2 text-sm text-amber-50 placeholder-amber-400/40 focus:outline-none focus:border-amber-500 mb-3"
        />
        <div class="flex gap-2">
          <button @click="showCreate = false" class="flex-1 text-sm py-1.5 rounded-lg border border-amber-900/40 text-amber-400 hover:bg-amber-900/20 transition-colors">Cancelar</button>
          <button @click="createTask" class="flex-1 text-sm py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-black transition-colors">Criar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { api } from '@/lib/api'

type Status = 'BACKLOG' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
interface Task { id: string; title: string; description: string | null; status: Status }

const route = useRoute()
const projectId = route.params.id as string
const projectName = ref('')
const tasks = ref<Task[]>([])
const showCreate = ref(false)
const newTask = ref({ title: '', description: '' })

const columns = [
  { status: 'BACKLOG' as Status, label: 'Backlog', labelClass: 'text-amber-400/60' },
  { status: 'IN_PROGRESS' as Status, label: 'Em progresso', labelClass: 'text-blue-400/80' },
  { status: 'DONE' as Status, label: 'Concluído', labelClass: 'text-green-400/80' },
]

const STATUS_TRANSITIONS: Record<Status, { status: Status; label: string; btnClass: string }[]> = {
  BACKLOG: [{ status: 'IN_PROGRESS', label: '→ progresso', btnClass: 'border-blue-800/50 text-blue-400 hover:bg-blue-900/20' }],
  IN_PROGRESS: [
    { status: 'DONE', label: '✓ concluir', btnClass: 'border-green-800/50 text-green-400 hover:bg-green-900/20' },
    { status: 'BACKLOG', label: '← backlog', btnClass: 'border-amber-800/50 text-amber-400/60 hover:bg-amber-900/20' },
  ],
  DONE: [{ status: 'BACKLOG', label: '↩ reabrir', btnClass: 'border-amber-800/50 text-amber-400/60 hover:bg-amber-900/20' }],
  CANCELLED: [],
}

function tasksByStatus(status: Status) {
  return tasks.value.filter((t) => t.status === status)
}

function nextStatuses(status: Status) {
  return STATUS_TRANSITIONS[status] ?? []
}

async function updateStatus(taskId: string, status: Status) {
  await api.patch(`/tasks/${taskId}`, { status })
  const task = tasks.value.find((t) => t.id === taskId)
  if (task) task.status = status
}

async function createTask() {
  if (!newTask.value.title.trim()) return
  const { data } = await api.post<Task>(`/projects/${projectId}/tasks`, newTask.value)
  tasks.value.push(data)
  showCreate.value = false
  newTask.value = { title: '', description: '' }
}

onMounted(async () => {
  const { data } = await api.get<Task[]>(`/projects/${projectId}/tasks`)
  tasks.value = data
  const { data: projects } = await api.get<{ id: string; name: string }[]>('/projects')
  projectName.value = projects.find((p) => p.id === projectId)?.name ?? 'Projeto'
})
</script>
