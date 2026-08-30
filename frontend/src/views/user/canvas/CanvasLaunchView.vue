<template>
  <AppLayout>
    <main class="canvas-launch">
      <section class="launch-card" aria-labelledby="canvas-launch-title">
        <div class="launch-icon" aria-hidden="true">∞</div>
        <h1 id="canvas-launch-title">JKAI 画布</h1>
        <p v-if="selectedKey">
          JKAI 画布已在新窗口中打开。如果窗口被关闭，可以在这里重新打开。
        </p>
        <p v-else>请选择用于 JKAI 画布的分组，然后在新窗口中打开画布。</p>

        <div v-if="choosingGroup || !selectedKey" class="group-picker">
          <label for="canvas-key-select">选择分组</label>
          <select id="canvas-key-select" v-model="selectedApiKeyId" :disabled="loadingKeys || !imageApiKeys.length">
            <option value="" disabled>{{ loadingKeys ? '正在加载分组' : '请选择分组' }}</option>
            <option v-for="key in imageApiKeys" :key="key.id" :value="String(key.id)">
              {{ key.group?.name || key.name }} · {{ key.name }}
            </option>
          </select>
          <p v-if="loadError" class="launch-error">{{ loadError }}</p>
        </div>

        <div class="launch-actions">
          <button class="launch-button secondary" type="button" :disabled="loadingKeys" @click="chooseAgain">
            <span aria-hidden="true">⚙</span>
            重新选择分组
          </button>
          <button class="launch-button primary" type="button" :disabled="!selectedKey" @click="openCanvas">
            重新打开 JKAI 画布
          </button>
        </div>
      </section>
    </main>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import * as keysAPI from '@/api/keys'
import type { ApiKey } from '@/types'

const SELECTED_API_KEY_STORAGE_KEY = 'jkapi_canvas_selected_api_key'

const router = useRouter()
const apiKeys = ref<ApiKey[]>([])
const selectedApiKeyId = ref('')
const loadingKeys = ref(false)
const choosingGroup = ref(false)
const loadError = ref('')

const imageApiKeys = computed(() =>
  apiKeys.value.filter((key) => {
    const groupName = key.group?.name?.toLowerCase() || ''
    const keyName = key.name.toLowerCase()
    return key.group?.allow_image_generation || groupName.includes('生图') || groupName.includes('画布') || keyName.includes('生图') || keyName.includes('画布')
  })
)

const selectedKey = computed(() => imageApiKeys.value.find((key) => String(key.id) === selectedApiKeyId.value) || null)

async function loadKeys() {
  loadingKeys.value = true
  loadError.value = ''
  try {
    const response = await keysAPI.list(1, 100, { status: 'active', sort_by: 'created_at', sort_order: 'desc' })
    apiKeys.value = response.items
    const saved = localStorage.getItem(SELECTED_API_KEY_STORAGE_KEY) || ''
    const preferred =
      imageApiKeys.value.find((key) => String(key.id) === saved) ||
      imageApiKeys.value.find((key) => key.name.includes('AI画布') || key.name.includes('生图')) ||
      imageApiKeys.value[0]
    selectedApiKeyId.value = preferred ? String(preferred.id) : ''
    choosingGroup.value = !preferred
    if (!preferred) loadError.value = '当前账号没有可用于生图的分组或密钥。'
  } catch {
    loadError.value = '未能加载分组，请刷新后重试。'
    choosingGroup.value = true
  } finally {
    loadingKeys.value = false
  }
}

function chooseAgain() {
  choosingGroup.value = true
}

function openCanvas() {
  if (!selectedKey.value) {
    choosingGroup.value = true
    return
  }
  localStorage.setItem(SELECTED_API_KEY_STORAGE_KEY, selectedApiKeyId.value)
  choosingGroup.value = false
  const target = router.resolve({ path: '/canvas/image', query: { embedded: 'new-api' } })
  window.open(target.href, '_blank', 'noopener,noreferrer')
}

onMounted(() => {
  void loadKeys()
})
</script>

<style scoped>
.canvas-launch {
  min-height: calc(100vh - 64px);
  display: grid;
  place-items: center;
  padding: 48px 24px;
  background: #f6f8fb;
}

.launch-card {
  width: min(760px, 100%);
  display: grid;
  justify-items: center;
  gap: 20px;
  padding: 48px 42px;
  border: 1px solid #e3e8ef;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 24px 60px rgba(41, 57, 78, .12);
  text-align: center;
}

.launch-icon {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: #eaf2ff;
  color: #1267f7;
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
}

.launch-card h1 {
  margin: 8px 0 0;
  color: #1f2937;
  font-size: 22px;
  line-height: 1.25;
}

.launch-card p {
  margin: 0;
  color: #374151;
  font-size: 16px;
  line-height: 1.7;
}

.group-picker {
  width: min(430px, 100%);
  display: grid;
  gap: 8px;
  text-align: left;
}

.group-picker label {
  color: #4b5563;
  font-size: 13px;
  font-weight: 700;
}

.group-picker select {
  width: 100%;
  height: 42px;
  border: 1px solid #d7dde6;
  border-radius: 6px;
  background: #fff;
  color: #1f2937;
  padding: 0 12px;
}

.launch-error {
  color: #c2410c !important;
  font-size: 13px !important;
}

.launch-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.launch-button {
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 20px;
  border-radius: 7px;
  font-weight: 700;
  transition: opacity .15s ease, background-color .15s ease;
}

.launch-button.secondary {
  border: 1px solid #d8dee8;
  background: #fff;
  color: #1f2937;
}

.launch-button.primary {
  border: 1px solid #1267f7;
  background: #1267f7;
  color: #fff;
}

.launch-button:disabled {
  cursor: not-allowed;
  opacity: .48;
}

@media (max-width: 640px) {
  .canvas-launch {
    padding: 28px 14px;
  }

  .launch-card {
    padding: 34px 18px;
  }

  .launch-actions,
  .launch-button {
    width: 100%;
  }
}
</style>
