<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <!-- Header -->
    <div class="border-b border-amber-900/30 px-6 py-3 flex items-center justify-between flex-shrink-0">
      <div class="flex items-center gap-3">
        <RouterLink to="/" class="font-mono text-xs text-amber-600 hover:text-amber-400 transition-colors">← projetos</RouterLink>
        <span class="text-amber-400/40">·</span>
        <span class="text-amber-50 font-medium">{{ projectName }}</span>
      </div>
      <button @click="showCreate = true" class="text-xs px-3 py-1.5 rounded-lg border border-amber-800/50 text-amber-300 hover:bg-amber-900/20 transition-colors">
        + Nova task
      </button>
    </div>

    <!-- Kanban -->
    <div class="flex-1 overflow-x-auto px-6 py-5">
      <div class="flex gap-4 h-full" style="min-width: max-content">
        <div
          v-for="col in columns" :key="col.status"
          class="w-72 flex flex-col rounded-xl border border-amber-900/20 bg-amber-950/10"
          @dragover.prevent="dragOver(col.status)"
          @drop="drop(col.status)"
          :class="{ 'border-amber-500/40 bg-amber-900/15': dragTarget === col.status }"
        >
          <!-- Column header -->
          <div class="px-4 py-3 border-b border-amber-900/20 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full flex-shrink-0" :class="col.dotClass" />
              <span class="text-xs font-medium uppercase tracking-wider" :class="col.labelClass">{{ col.label }}</span>
            </div>
            <span class="font-mono text-xs text-amber-400/30">{{ tasksByStatus(col.status).length }}</span>
          </div>

          <!-- Tasks -->
          <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            <div
              v-for="task in tasksByStatus(col.status)" :key="task.id"
              draggable="true"
              @dragstart="dragStart(task)"
              @dragend="dragEnd"
              class="group rounded-lg border border-amber-900/25 bg-amber-950/20 p-3 cursor-grab active:cursor-grabbing transition-all hover:border-amber-700/40 hover:bg-amber-900/20"
              :class="{ 'opacity-40 scale-95': dragging?.id === task.id }"
            >
              <div class="flex items-start justify-between gap-2 mb-1.5">
                <p class="text-sm text-amber-100 leading-snug flex-1">{{ task.title }}</p>
                <button
                  @click="deleteTask(task.id)"
                  class="opacity-0 group-hover:opacity-100 text-amber-700 hover:text-red-400 transition-all text-xs flex-shrink-0 mt-0.5"
                  title="Remover"
                >✕</button>
              </div>
              <p v-if="task.description" class="text-xs text-amber-400/50 mb-2 line-clamp-2">{{ task.description }}</p>
              <!-- Metadata -->
              <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-amber-500/40 font-mono">
                <span v-if="task.createdBy" title="Criado por">↑ {{ task.createdBy }}</span>
                <span v-if="task.lastEditedBy" title="Última edição">✎ {{ task.lastEditedBy }}</span>
                <span v-if="task.updatedAt" :title="new Date(task.updatedAt).toLocaleString('pt-BR')">
                  {{ timeAgo(task.updatedAt) }}
                </span>
              </div>
            </div>

            <!-- Drop zone hint -->
            <div
              v-if="dragTarget === col.status && dragging && dragging.status !== col.status"
              class="border-2 border-dashed border-amber-500/30 rounded-lg h-12 flex items-center justify-center text-xs text-amber-500/40"
            >
              soltar aqui
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create task modal -->
    <div v-if="showCreate" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" @click.self="showCreate = false">
      <div class="bg-[#1e1500] border border-amber-900/50 rounded-2xl p-6 w-96 shadow-2xl">
        <h2 class="text-base font-semibold text-amber-100 mb-4">Nova task</h2>
        <input v-model="newTask.title" type="text" placeholder="Título da task"
          class="w-full bg-amber-950/50 border border-amber-800/40 rounded-lg px-3 py-2 text-sm text-amber-50 placeholder-amber-400/30 focus:outline-none focus:border-amber-500 mb-2"
          @keyup.enter="createTask" autofocus
        />
        <textarea v-model="newTask.description" placeholder="Descrição (opcional)" rows="2"
          class="w-full bg-amber-950/50 border border-amber-800/40 rounded-lg px-3 py-2 text-sm text-amber-50 placeholder-amber-400/30 focus:outline-none focus:border-amber-500 mb-4 resize-none"
        />
        <div class="flex gap-2">
          <button @click="showCreate = false" class="flex-1 text-sm py-2 rounded-lg border border-amber-900/40 text-amber-400 hover:bg-amber-900/20 transition-colors">Cancelar</button>
          <button @click="createTask" :disabled="!newTask.title.trim()" class="flex-1 text-sm py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-black font-medium transition-colors disabled:opacity-40">Criar</button>
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

interface Task {
  id: string
  title: string
  description: string | null
  status: Status
  projectId: string
  createdAt: string
  updatedAt: string
  createdBy: string | null
  lastEditedBy: string | null
}

const route = useRoute()
const projectId = route.params.id as string
const projectName = ref('')
const tasks = ref<Task[]>([])
const showCreate = ref(false)
const newTask = ref({ title: '', description: '' })
const dragging = ref<Task | null>(null)
const dragTarget = ref<Status | null>(null)

const columns = [
  { status: 'BACKLOG' as Status, label: 'Backlog', labelClass: 'text-amber-500/70', dotClass: 'bg-amber-700' },
  { status: 'IN_PROGRESS' as Status, label: 'Em progresso', labelClass: 'text-blue-400/80', dotClass: 'bg-blue-500' },
  { status: 'DONE' as Status, label: 'Concluído', labelClass: 'text-green-400/80', dotClass: 'bg-green-500' },
]

function tasksByStatus(status: Status) {
  return tasks.value.filter(t => t.status === status)
}

function dragStart(task: Task) {
  dragging.value = task
}

function dragEnd() {
  dragging.value = null
  dragTarget.value = null
}

function dragOver(status: Status) {
  if (dragging.value) dragTarget.value = status
}

async function drop(status: Status) {
  if (!dragging.value || dragging.value.status === status) {
    dragEnd()
    return
  }
  const task = dragging.value
  dragEnd()
  task.status = status
  await api.patch(`/tasks/${task.id}`, { status })
}

async function createTask() {
  if (!newTask.value.title.trim()) return
  const { data } = await api.post<Task>(`/projects/${projectId}/tasks`, newTask.value)
  tasks.value.push(data)
  showCreate.value = false
  newTask.value = { title: '', description: '' }
}

async function deleteTask(id: string) {
  await api.delete(`/tasks/${id}`)
  tasks.value = tasks.value.filter(t => t.id !== id)
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

onMounted(async () => {
  const [{ data: tasksData }, { data: projects }] = await Promise.all([
    api.get<Task[]>(`/projects/${projectId}/tasks`),
    api.get<{ id: string; name: string }[]>('/projects'),
  ])
  tasks.value = tasksData
  projectName.value = projects.find(p => p.id === projectId)?.name ?? 'Projeto'
})
</script>
