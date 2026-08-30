<template><section class="suite-page"><div class="suite-titlebar"><div><p>画布库</p><h1>无限画布</h1></div><div class="suite-actions"><button class="suite-btn danger" :disabled="!selected.length" @click="removeSelected">删除全部</button><button class="suite-btn" @click="fileInput?.click()">导入画布</button><button class="suite-btn primary" @click="create">新建画布</button><input ref="fileInput" hidden type="file" accept="application/json" @change="importCanvas"></div></div><div v-if="items.length" class="suite-grid"><article v-for="item in items" :key="item.id" class="suite-card canvas-card"><input v-model="selected" class="canvas-check" type="checkbox" :value="item.id" :aria-label="`选择 ${item.title}`"><button class="canvas-open" @click="open(item)"><h2>{{ item.title }}</h2><p>{{ item.nodes }} 个节点 · {{ item.edges }} 条连线</p></button><p>更新于 {{ formatDate(item.updatedAt) }}</p><div class="suite-card-actions"><button class="suite-btn" @click="exportOne(item)">导出</button><button class="suite-btn" @click="rename(item)">重命名</button><button class="suite-btn danger" @click="remove(item.id)">删除</button></div></article></div><div v-else class="suite-empty"><h2>还没有画布</h2><p>新建一个画布后，就可以独立保存节点、连线和画布外观。</p><button class="suite-btn primary" @click="create">新建画布</button></div></section></template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { canvasStorage, downloadJson, makeId, readJsonFile, type CanvasExport, type CanvasRecord } from './storage'

const router = useRouter()
const items = ref(canvasStorage.canvases())
const fileInput = ref<HTMLInputElement | null>(null)
const selected = ref<string[]>([])

function persist() {
  canvasStorage.saveCanvases(items.value)
}

function create() {
  const item = { id: makeId('canvas'), title: `无限画布 ${items.value.length + 1}`, nodes: 0, edges: 0, updatedAt: new Date().toISOString() }
  items.value.unshift(item)
  persist()
  open(item)
}

function open(item: CanvasRecord) {
  canvasStorage.setActiveCanvasId(item.id)
  void router.push('/canvas/editor')
}

function rename(item: CanvasRecord) {
  const name = prompt('画布名称', item.title)?.trim()
  if (name) {
    item.title = name
    item.updatedAt = new Date().toISOString()
    persist()
  }
}

function remove(id: string) {
  if (!confirm('确定删除这个画布吗？')) return
  items.value = items.value.filter((item) => item.id !== id)
  canvasStorage.removeBoard(id)
  persist()
}

function removeSelected() {
  if (!selected.value.length || !confirm(`确定删除选中的 ${selected.value.length} 个画布吗？`)) return
  selected.value.forEach((id) => canvasStorage.removeBoard(id))
  items.value = items.value.filter((item) => !selected.value.includes(item.id))
  selected.value = []
  persist()
}

function exportOne(item: CanvasRecord) {
  const payload: CanvasExport = { record: item, board: canvasStorage.board(item.id), exportedAt: new Date().toISOString() }
  downloadJson(`${item.title}.json`, payload)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

async function importCanvas(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const value = await readJsonFile<CanvasExport | CanvasRecord>(file)
    const sourceRecord = 'record' in value ? value.record : value
    const board = 'board' in value ? value.board : {}
    const id = makeId('canvas')
    const item = { ...sourceRecord, id, updatedAt: new Date().toISOString() }
    items.value.unshift(item)
    if (Object.keys(board).length) canvasStorage.saveBoard(id, board)
    persist()
  } catch {
    alert('画布文件格式不正确')
  } finally {
    input.value = ''
  }
}

onMounted(() => {
  items.value = canvasStorage.canvases()
})
</script>
<style scoped>.canvas-card{position:relative;min-height:170px}.canvas-check{position:absolute;top:14px;right:14px}.canvas-open{display:block;width:100%;text-align:left;border:0;background:transparent;padding:0;color:inherit}.canvas-open h2{font-size:19px}.canvas-card>.suite-card-actions{margin-top:24px}.suite-empty h2{margin:0 0 8px}.suite-empty .suite-btn{margin-top:20px}</style>
