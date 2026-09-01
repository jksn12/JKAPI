<template>
  <div class="space-y-5">
    <section
      class="overflow-hidden rounded-[2rem] border bg-white shadow-card dark:bg-dark-800/50"
      :class="platformBorderStrongClass(group.platform)"
      :style="accentStyle"
    >
      <div class="border-b border-gray-100 px-5 py-5 dark:border-dark-700/60 lg:px-7">
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold"
            :class="platformBadgeLightClass(group.platform)"
          >
            {{ platformLabel(group.platform) }}
          </span>
          <span
            v-if="group.is_exclusive"
            class="inline-flex items-center rounded-full bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-600 dark:bg-violet-900/20 dark:text-violet-300"
          >
            特价号池
          </span>
          <span
            class="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
          >
            分组倍率×{{ effectiveRateText }}
          </span>
        </div>

        <div class="mt-5 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div class="flex min-w-0 items-start gap-4">
            <div
              class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border bg-white text-3xl shadow-sm dark:border-dark-700 dark:bg-dark-900"
            >
              {{ platformEmoji(group.platform) }}
            </div>
            <div class="min-w-0">
              <h2 class="truncate text-2xl font-extrabold tracking-tight text-gray-950 dark:text-white">
                {{ group.name }}
              </h2>
              <p class="mt-1 text-base text-gray-500 dark:text-dark-300">
                {{ group.description || '稳定号池，按分组倍率展示实付定价' }}
              </p>
              <p v-if="peakNote" class="mt-2 text-xs text-amber-600 dark:text-amber-400">
                {{ peakNote }}
              </p>
            </div>
          </div>

          <div v-if="monitor" class="min-w-0 flex-1 xl:max-w-[44rem]">
            <div class="mb-2 flex items-center justify-between gap-3 text-xs text-gray-400 dark:text-dark-400">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-semibold text-gray-500 dark:text-dark-300">渠道状态 · 最近 60 次检测</span>
                <span class="rounded-full px-2 py-0.5 font-semibold" :class="statusBadgeClass(monitor.primary_status)">
                  {{ statusLabel(monitor.primary_status) }}
                </span>
              </div>
              <span>{{ monitorTimeText }}</span>
            </div>
            <div class="flex h-8 items-end gap-1 overflow-hidden">
              <span
                v-for="(point, idx) in statusBars"
                :key="idx"
                class="min-w-[0.45rem] flex-1 rounded-sm"
                :class="barClass(point)"
                :style="{ height: barHeight(point) }"
                :title="barTitle(point)"
              ></span>
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-dark-400">
              <span>可用率 {{ availabilityText }}</span>
              <span>延迟 {{ latencyText }}</span>
              <span v-if="monitor.primary_model" class="font-mono">{{ monitor.primary_model }}</span>
            </div>
          </div>

          <div class="grid shrink-0 grid-cols-3 gap-3 text-sm">
            <div class="rounded-2xl border border-gray-100 px-5 py-3 dark:border-dark-700">
              <p class="text-gray-400 dark:text-dark-400">接入格式</p>
              <p class="mt-1 font-bold text-gray-900 dark:text-white">{{ platformLabel(group.platform) }} 格式</p>
            </div>
            <div class="rounded-2xl border border-gray-100 px-5 py-3 dark:border-dark-700">
              <p class="text-gray-400 dark:text-dark-400">模型数量</p>
              <p class="mt-1 font-bold text-gray-900 dark:text-white">{{ group.models.length }}</p>
            </div>
            <div class="rounded-2xl border border-gray-100 px-5 py-3 dark:border-dark-700">
              <p class="text-gray-400 dark:text-dark-400">号池分组</p>
              <p class="mt-1 max-w-32 truncate font-bold text-gray-900 dark:text-white">{{ group.name }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 lg:p-7">
        <article
          v-for="model in sortedModels"
          :key="`${model.platform}:${model.name}`"
          class="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-dark-700 dark:bg-dark-900/60"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="truncate text-lg font-extrabold text-gray-950 dark:text-white">
                {{ displayModelName(model.name) }}
              </h3>
              <p class="mt-1 truncate font-mono text-sm text-gray-400 dark:text-dark-400">
                {{ model.name }}
              </p>
            </div>
            <span class="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
              {{ billingBadge(model) }}
            </span>
          </div>

          <div class="mt-5 space-y-3">
            <div
              v-for="line in priceLines(model)"
              :key="line.key"
              class="rounded-2xl border border-gray-100 px-4 py-3 dark:border-dark-700"
            >
              <div class="flex items-center justify-between gap-4">
                <span class="shrink-0 text-base text-gray-400 dark:text-dark-400">{{ line.label }}</span>
                <span class="text-right text-base font-extrabold leading-6 text-gray-900 dark:text-white">
                  {{ line.value }}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            @click="selectedModel = model"
            class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
          >
            <span>◎</span>
            查看详细定价
          </button>
        </article>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="selectedModel"
        class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        @click.self="selectedModel = null"
      >
        <div class="max-h-[88vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-dark-900">
          <div class="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-dark-700">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-blue-600 dark:text-blue-300">详细定价</p>
              <h3 class="mt-1 truncate text-2xl font-extrabold text-gray-950 dark:text-white">
                {{ displayModelName(selectedModel.name) }}
              </h3>
              <p class="mt-1 font-mono text-sm text-gray-400 dark:text-dark-400">{{ selectedModel.name }}</p>
            </div>
            <button
              type="button"
              class="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-50 dark:border-dark-700 dark:text-dark-300 dark:hover:bg-dark-800"
              @click="selectedModel = null"
            >
              关闭
            </button>
          </div>
          <div class="max-h-[calc(88vh-7rem)] overflow-auto p-5">
            <PlazaModelPricingTable
              :models="[selectedModel]"
              :platform="group.platform"
              :rate-multiplier="group.rate_multiplier"
              :user-rate-multiplier="null"
              :image-rate-independent="group.image_rate_independent"
              :image-rate-multiplier="group.image_rate_multiplier"
              :peak-window="peakWindow"
              :peak-rate-multiplier="group.peak_rate_multiplier"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ModelPlazaGroup, PlazaModel } from '@/api/modelPlaza'
import type { MonitorTimelinePoint, UserMonitorView } from '@/api/channelMonitor'
import type { UserPricingInterval } from '@/api/channels'
import { BILLING_MODE_IMAGE, BILLING_MODE_TOKEN, type BillingMode } from '@/constants/channel'
import { formatScaled } from '@/utils/pricing'
import PlazaModelPricingTable from './PlazaModelPricingTable.vue'
import { useChannelMonitorFormat } from '@/composables/useChannelMonitorFormat'
import {
  platformAccentColor,
  platformBadgeLightClass,
  platformBorderStrongClass,
  platformLabel
} from '@/utils/platformColors'
import { formatPeakRateWindow, hasPeakRate, serverTimezoneLabel } from '@/utils/peak-rate'
import { useAppStore } from '@/stores/app'

const props = defineProps<{
  group: ModelPlazaGroup
  monitor?: UserMonitorView
}>()

const { t } = useI18n()
const appStore = useAppStore()
const { statusLabel, statusBadgeClass, formatLatency } = useChannelMonitorFormat()
const selectedModel = ref<PlazaModel | null>(null)

const PER_MILLION = 1_000_000
const MIN_DECIMALS = 2

const sortedModels = computed(() =>
  [...props.group.models].sort((a, b) => {
    const ao = a.official_pricing?.output_price ?? null
    const bo = b.official_pricing?.output_price ?? null
    if (ao != null && bo != null && ao !== bo) return bo - ao
    return b.name.localeCompare(a.name)
  })
)

// 模型广场是号池/分组报价牌：展示后台分组的公开倍率。
// 用户专属倍率只用于实际请求扣费/账单口径，不参与这里的分组报价展示，
// 避免管理员查看时被自己的专属倍率覆盖成“分组倍率”。
const effectiveRate = computed(() => props.group.rate_multiplier)
const effectiveRateText = computed(() => Number(effectiveRate.value.toPrecision(10)))
const accentStyle = computed(() => ({ '--plaza-accent': platformAccentColor(props.group.platform) }))
const statusBars = computed(() => (props.monitor?.timeline ?? []).slice(0, 60).reverse())
const monitorTimeText = computed(() => {
  const latest = props.monitor?.timeline?.[0]?.checked_at
  if (!latest) return ''
  return new Date(latest).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
})
const availabilityText = computed(() => {
  const v = props.monitor?.availability_7d
  return v == null ? '-' : `${Number(v.toFixed(2))}%`
})
const latencyText = computed(() => `${formatLatency(props.monitor?.primary_latency_ms ?? null)}ms`)
const peakWindow = computed(() => {
  if (!hasPeakRate(props.group)) return ''
  return formatPeakRateWindow(
    props.group,
    serverTimezoneLabel(appStore.cachedPublicSettings?.server_utc_offset)
  )
})

const peakNote = computed(() => {
  if (!peakWindow.value) return ''
  return t('modelPlaza.detail.peakNote', {
    window: peakWindow.value,
    multiplier: props.group.peak_rate_multiplier
  })
})

interface PriceLine {
  key: string
  label: string
  value: string
}

function billingMode(m: PlazaModel): BillingMode {
  return (m.pricing?.billing_mode || BILLING_MODE_TOKEN) as BillingMode
}

function billingBadge(m: PlazaModel): string {
  if (billingMode(m) === BILLING_MODE_IMAGE) return '图片计费'
  if (tokenIntervals(m).length > 1) return '按上下文区间定价'
  return 'Token 计费'
}

function priceLines(m: PlazaModel): PriceLine[] {
  if (billingMode(m) !== BILLING_MODE_TOKEN) {
    const intervals = (m.pricing?.intervals ?? []).filter((iv) => iv.per_request_price != null)
    if (intervals.length) {
      return intervals.map((iv, idx) => ({
        key: `request-${idx}`,
        label: tierLabel(iv),
        value: `${paidRequestPrice(m, iv.per_request_price)} ${perUnitSuffix(m)}`
      }))
    }
    if (m.pricing?.per_request_price != null) {
      return [{
        key: 'request',
        label: billingMode(m) === BILLING_MODE_IMAGE ? '按图' : '按次',
        value: `${paidRequestPrice(m, m.pricing.per_request_price)} ${perUnitSuffix(m)}`
      }]
    }
    return [
      {
        key: 'image-input',
        label: '图片输入',
        value: `${paidPerMillion(m.pricing?.image_input_price)} / 1M Token`
      },
      {
        key: 'image-output',
        label: '图片输出',
        value: `${paidPerMillion(m.pricing?.image_output_price)} / 1M Token`
      }
    ].filter((line) => !line.value.startsWith('-'))
  }

  const intervals = tokenIntervals(m)
  if (intervals.length) {
    return intervals.map((iv, idx) => ({
      key: `tier-${idx}`,
      label: tierRangeLabel(iv),
      value: `输入 ${paidPerMillion(iv.input_price)} / 输出 ${paidPerMillion(iv.output_price)}`
    }))
  }
  return [
    {
      key: 'input',
      label: '输入',
      value: `${paidPerMillion(m.pricing?.input_price)} / 1M Token`
    },
    {
      key: 'output',
      label: '输出',
      value: `${paidPerMillion(m.pricing?.output_price)} / 1M Token`
    }
  ]
}

function paidPerMillion(value: number | null | undefined): string {
  if (value == null) return '-'
  return formatScaled(value * effectiveRate.value, PER_MILLION, MIN_DECIMALS).replace('$', '')
}

function paidRequestPrice(m: PlazaModel, value: number | null | undefined): string {
  if (value == null) return '-'
  const rate = billingMode(m) === BILLING_MODE_IMAGE && props.group.image_rate_independent
    ? props.group.image_rate_multiplier
    : effectiveRate.value
  return formatScaled(value * rate, 1, MIN_DECIMALS).replace('$', '')
}

function perUnitSuffix(m: PlazaModel): string {
  return billingMode(m) === BILLING_MODE_IMAGE ? '/ 张' : '/ 次'
}

function tokenIntervals(m: PlazaModel): UserPricingInterval[] {
  return [...(m.pricing?.intervals ?? [])].sort((a, b) => a.min_tokens - b.min_tokens)
}

function tierRangeLabel(iv: UserPricingInterval): string {
  if (iv.tier_label) return iv.tier_label
  const min = iv.min_tokens
  const max = iv.max_tokens
  if (max == null) return `${formatTokenCount(min)}+`
  if (min <= 0) return `0-${formatTokenCount(max)}`
  return `${formatTokenCount(min)}-${formatTokenCount(max)}`
}

function tierLabel(iv: UserPricingInterval): string {
  return iv.tier_label || tierRangeLabel(iv)
}

function formatTokenCount(n: number): string {
  if (n >= 1_000_000) return `${trimZero(n / 1_000_000)}M`
  if (n >= 1_000) return `${trimZero(n / 1_000)}K`
  return String(n)
}

function trimZero(n: number): string {
  return String(Math.round(n * 100) / 100)
}

function displayModelName(name: string): string {
  return name
    .split('-')
    .map((part) => part.length <= 3 ? part.toUpperCase() : part[0]?.toUpperCase() + part.slice(1))
    .join('-')
}

function platformEmoji(platform: string): string {
  switch (platform) {
    case 'openai': return '◎'
    case 'gemini': return '✦'
    case 'anthropic': return '●'
    case 'kimi': return '◒'
    default: return '◆'
  }
}

function barClass(point: MonitorTimelinePoint): string {
  switch (point.status) {
    case 'operational':
      return 'bg-emerald-500'
    case 'degraded':
      return 'bg-amber-500'
    case 'failed':
    case 'error':
      return 'bg-red-500'
    default:
      return 'bg-gray-300 dark:bg-dark-600'
  }
}

function barHeight(point: MonitorTimelinePoint): string {
  switch (point.status) {
    case 'operational':
      return '100%'
    case 'degraded':
      return '65%'
    case 'failed':
    case 'error':
      return '35%'
    default:
      return '15%'
  }
}

function barTitle(point: MonitorTimelinePoint): string {
  const checked = point.checked_at ? new Date(point.checked_at).toLocaleString('zh-CN') : ''
  return `${checked} · ${statusLabel(point.status)} · ${formatLatency(point.latency_ms)}ms`
}
</script>
