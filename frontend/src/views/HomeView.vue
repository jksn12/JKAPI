<template>
  <!-- Custom Home Content: Full Page Mode -->
  <div v-if="hasHomeContent" ref="customHomeRoot" class="min-h-screen">
    <!-- iframe mode -->
    <iframe
      v-if="isHomeContentUrl"
      :src="homeContent.trim()"
      class="h-screen w-full border-0"
      allowfullscreen
    ></iframe>
    <!-- HTML mode - SECURITY: homeContent is admin-only setting, XSS risk is acceptable -->
    <div v-else v-html="homeContent"></div>
  </div>

  <!-- Compact Home Page -->
  <div
    v-else-if="compactHomeEnabled"
    data-testid="compact-home"
    class="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-dark-950 dark:text-white"
  >
    <header class="border-b border-gray-200 px-4 py-4 sm:px-6 dark:border-dark-800">
      <nav class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <img
            :src="siteLogo || '/logo.svg'"
            alt="Logo"
            class="h-9 w-9 shrink-0 rounded-lg object-contain"
          />
          <span class="min-w-0 truncate text-base font-semibold">{{ siteName }}</span>
        </div>
        <div class="flex max-w-full shrink-0 flex-wrap items-center justify-end gap-2">
          <LocaleSwitcher />
          <a
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-dark-400 dark:hover:bg-dark-800"
            :title="t('home.viewDocs')"
          >
            <Icon name="book" size="md" />
          </a>
          <button
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-dark-400 dark:hover:bg-dark-800"
            :title="isDark ? t('home.switchToLight') : t('home.switchToDark')"
            @click="toggleTheme"
          >
            <Icon v-if="isDark" name="sun" size="md" />
            <Icon v-else name="moon" size="md" />
          </button>
          <router-link
            :to="isAuthenticated ? dashboardPath : '/login'"
            class="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {{ isAuthenticated ? t('home.dashboard') : t('home.login') }}
          </router-link>
        </div>
      </nav>
    </header>

    <main class="flex min-w-0 flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div class="min-w-0 max-w-2xl text-center">
        <img
          :src="siteLogo || '/logo.svg'"
          alt="Logo"
          class="mx-auto mb-6 h-20 w-20 rounded-2xl object-contain"
        />
        <h1 class="[overflow-wrap:anywhere] text-3xl font-bold md:text-4xl">{{ siteName }}</h1>
        <p class="mt-4 whitespace-pre-wrap [overflow-wrap:anywhere] text-base text-gray-600 dark:text-dark-300">{{ siteSubtitle }}</p>
        <router-link
          :to="isAuthenticated ? dashboardPath : '/login'"
          class="mt-8 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
        >
          {{ isAuthenticated ? t('home.goToDashboard') : t('home.login') }}
        </router-link>
      </div>
    </main>

    <footer class="min-w-0 border-t border-gray-200 px-4 py-5 text-center text-sm text-gray-500 [overflow-wrap:anywhere] sm:px-6 dark:border-dark-800 dark:text-dark-400">
      &copy; {{ currentYear }} {{ siteName }}
    </footer>
  </div>

  <!-- Default Home Page -->
  <div v-else data-testid="default-home" class="min-h-screen bg-white text-slate-900 dark:bg-dark-950 dark:text-white">
    <header class="border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-dark-800 dark:bg-dark-950/90 sm:px-6">
      <nav class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <img
            :src="siteLogo || '/logo.svg'"
            alt="Logo"
            class="h-10 w-10 shrink-0 rounded-lg object-contain ring-1 ring-slate-200 dark:ring-dark-800"
          />
          <div class="min-w-0">
            <p class="truncate text-base font-semibold">{{ siteName }}</p>
            <p class="truncate text-xs text-slate-500 dark:text-dark-400">{{ siteSubtitle }}</p>
          </div>
        </div>

        <div class="flex max-w-full shrink-0 flex-wrap items-center justify-end gap-2">
          <LocaleSwitcher />
          <a
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-dark-400 dark:hover:bg-dark-800 dark:hover:text-white"
            :title="t('home.viewDocs')"
          >
            <Icon name="book" size="md" />
          </a>
          <button
            class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-dark-400 dark:hover:bg-dark-800 dark:hover:text-white"
            :title="isDark ? t('home.switchToLight') : t('home.switchToDark')"
            @click="toggleTheme"
          >
            <Icon v-if="isDark" name="sun" size="md" />
            <Icon v-else name="moon" size="md" />
          </button>
          <router-link
            :to="isAuthenticated ? dashboardPath : '/login'"
            class="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <span v-if="isAuthenticated" class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-semibold text-white">
              {{ userInitial }}
            </span>
            {{ isAuthenticated ? t('home.dashboard') : t('home.login') }}
            <Icon name="arrowRight" size="sm" />
          </router-link>
        </div>
      </nav>
    </header>

    <main class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <section class="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:items-center">
        <div class="min-w-0">
          <div class="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-200">
            <Icon name="badge" size="sm" />
            <span>{{ t('home.launchBadge') }}</span>
          </div>

          <h1 class="mt-6 text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            {{ siteName }}
          </h1>
          <p class="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-dark-300">
            {{ siteSubtitle }}
          </p>
          <p class="mt-4 max-w-3xl text-base leading-7 text-slate-500 dark:text-dark-400">
            {{ t('home.heroDescription') }}
          </p>

          <div class="mt-8 flex flex-wrap gap-3">
            <router-link
              :to="isAuthenticated ? dashboardPath : '/login'"
              class="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <Icon name="arrowRight" size="sm" />
              {{ isAuthenticated ? t('home.goToDashboard') : t('home.getStarted') }}
            </router-link>
            <router-link
              to="/key-usage"
              class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700 dark:border-dark-700 dark:bg-dark-900 dark:text-dark-200 dark:hover:border-primary-700 dark:hover:text-primary-200"
            >
              <Icon name="chartBar" size="sm" />
              {{ t('keyUsage.title') }}
            </router-link>
            <a
              v-if="docUrl"
              :href="docUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700 dark:border-dark-700 dark:bg-dark-900 dark:text-dark-200 dark:hover:border-primary-700 dark:hover:text-primary-200"
            >
              <Icon name="book" size="sm" />
              {{ t('home.viewDocs') }}
            </a>
          </div>

          <div class="mt-8 grid gap-3 sm:grid-cols-3">
            <article
              v-for="item in heroHighlights"
              :key="item.titleKey"
              class="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-dark-800 dark:bg-dark-900/60"
            >
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-primary-600 ring-1 ring-slate-200 dark:bg-dark-950 dark:ring-dark-800">
                <Icon :name="item.icon" size="sm" />
              </div>
              <h2 class="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{{ t(item.titleKey) }}</h2>
              <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-dark-400">{{ t(item.descKey) }}</p>
            </article>
          </div>
        </div>

        <aside data-testid="gateway-panel" class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-dark-800 dark:bg-dark-900">
          <div class="flex items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-dark-800">
            <div class="flex min-w-0 items-center gap-3">
              <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary-600 ring-1 ring-primary-100 dark:bg-primary-900/30 dark:text-primary-200 dark:ring-primary-800">
                <Icon name="server" size="md" />
              </div>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-slate-900 dark:text-white">{{ t('home.gatewayPanel.title') }}</p>
                <p class="truncate text-xs text-slate-500 dark:text-dark-400">{{ t('home.gatewayPanel.route') }}</p>
              </div>
            </div>
            <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              {{ t('home.gatewayPanel.healthy') }}
            </span>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-3">
            <div
              v-for="metric in gatewayMetrics"
              :key="metric.labelKey"
              class="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-dark-800 dark:bg-dark-950/60"
            >
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-dark-500">{{ t(metric.labelKey) }}</p>
              <p class="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{{ t(metric.valueKey) }}</p>
            </div>
          </div>

          <div class="mt-5 rounded-lg bg-slate-950 p-4 text-slate-100 ring-1 ring-slate-900/10">
            <div class="flex items-center gap-2 text-xs text-slate-400">
              <Icon name="terminal" size="sm" class="text-emerald-400" />
              <span>{{ t('home.gatewayPanel.sampleLabel') }}</span>
            </div>
            <div class="mt-4 space-y-2 font-mono text-xs leading-6">
              <div class="flex items-center gap-2 text-emerald-400">
                <span class="text-slate-500">$</span>
                <span>{{ t('home.gatewayPanel.sampleRequest') }}</span>
              </div>
              <p class="text-slate-400">{{ t('home.gatewayPanel.sampleRoute') }}</p>
              <p><span class="text-cyan-300">{{ t('home.gatewayPanel.sampleResponse') }}</span> {{ t('home.gatewayPanel.samplePayload') }}</p>
            </div>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-dark-800 dark:bg-dark-950/60">
              <div class="flex items-center gap-2">
                <Icon name="shield" size="sm" class="text-primary-500" />
                <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ t('home.gatewayPanel.controlQuota') }}</p>
              </div>
              <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-dark-400">{{ t('home.gatewayPanel.controlQuotaDesc') }}</p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-dark-800 dark:bg-dark-950/60">
              <div class="flex items-center gap-2">
                <Icon name="swap" size="sm" class="text-primary-500" />
                <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ t('home.gatewayPanel.controlRouting') }}</p>
              </div>
              <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-dark-400">{{ t('home.gatewayPanel.controlRoutingDesc') }}</p>
            </div>
          </div>
        </aside>
      </section>

      <section class="mt-16">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div class="max-w-2xl">
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">{{ t('home.solutions.title') }}</p>
            <h2 class="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{{ t('home.solutions.subtitle') }}</h2>
            <p class="mt-3 text-base leading-7 text-slate-600 dark:text-dark-400">{{ t('home.cta.description') }}</p>
          </div>
          <router-link
            :to="isAuthenticated ? dashboardPath : '/login'"
            class="inline-flex min-h-11 items-center gap-2 self-start rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {{ isAuthenticated ? t('home.goToDashboard') : t('home.getStarted') }}
            <Icon name="arrowRight" size="sm" />
          </router-link>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-3">
          <article
            v-for="feature in commercialFeatures"
            :key="feature.titleKey"
            class="rounded-lg border border-slate-200 bg-white p-5 dark:border-dark-800 dark:bg-dark-900"
          >
            <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary-600 ring-1 ring-primary-100 dark:bg-primary-900/30 dark:text-primary-200 dark:ring-primary-800">
              <Icon :name="feature.icon" size="md" />
            </div>
            <h3 class="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{{ t(feature.titleKey) }}</h3>
            <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-dark-400">{{ t(feature.descKey) }}</p>
          </article>
        </div>
      </section>

      <section class="mt-16">
        <div class="max-w-2xl">
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">{{ t('home.providers.title') }}</p>
          <h2 class="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{{ t('home.providers.description') }}</h2>
        </div>

        <div class="mt-6 flex flex-wrap gap-3">
          <div
            v-for="provider in providers"
            :key="provider.name"
            class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-dark-800 dark:bg-dark-900"
          >
            <div :class="['flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white', provider.accent]">
              {{ provider.initial }}
            </div>
            <span class="text-sm font-medium text-slate-700 dark:text-dark-200">{{ provider.name }}</span>
            <span
              :class="[
                'rounded px-2 py-0.5 text-[10px] font-medium',
                provider.status === 'supported'
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-dark-800 dark:text-dark-400'
              ]"
            >
              {{ provider.status === 'supported' ? t('home.providers.supported') : t('home.providers.soon') }}
            </span>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t border-slate-200 px-4 py-8 text-sm text-slate-500 dark:border-dark-800 dark:text-dark-400 sm:px-6">
      <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <p>&copy; {{ currentYear }} {{ siteName }}. {{ t('home.footer.allRightsReserved') }}</p>
        <div class="flex items-center gap-4">
          <a
            v-if="docUrl"
            :href="docUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="transition-colors hover:text-slate-700 dark:hover:text-white"
          >
            {{ t('home.docs') }}
          </a>
          <a
            :href="githubUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="transition-colors hover:text-slate-700 dark:hover:text-white"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore, useAppStore } from '@/stores'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import Icon from '@/components/icons/Icon.vue'
import { sanitizeUrl } from '@/utils/url'

const { t } = useI18n()

const authStore = useAuthStore()
const appStore = useAppStore()

// Site settings - directly from appStore (already initialized from injected config)
const siteName = computed(() => appStore.cachedPublicSettings?.site_name || appStore.siteName || 'JKAPI')
const siteLogo = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.site_logo || appStore.siteLogo || '', { allowRelative: true, allowDataUrl: true }))
const siteSubtitle = computed(() => appStore.cachedPublicSettings?.site_subtitle || 'Commercial AI API Gateway')
const docUrl = computed(() => sanitizeUrl(appStore.cachedPublicSettings?.doc_url || appStore.docUrl || ''))
const homeContent = computed(() => appStore.cachedPublicSettings?.home_content || '')
const hasHomeContent = computed(() => homeContent.value.trim().length > 0)
const compactHomeEnabled = computed(() => appStore.cachedPublicSettings?.compact_home_enabled === true)
const customHomeRoot = ref<HTMLElement | null>(null)

// Check if homeContent is a URL (for iframe display)
const isHomeContentUrl = computed(() => {
  const content = homeContent.value.trim()
  return content.startsWith('http://') || content.startsWith('https://')
})

// Theme
const isDark = ref(document.documentElement.classList.contains('dark'))

// GitHub URL
const githubUrl = 'https://github.com/jksn12/JKAPI'

const heroHighlights = [
  {
    icon: 'key',
    titleKey: 'home.highlights.unifiedAccess.title',
    descKey: 'home.highlights.unifiedAccess.desc'
  },
  {
    icon: 'swap',
    titleKey: 'home.highlights.routing.title',
    descKey: 'home.highlights.routing.desc'
  },
  {
    icon: 'chartBar',
    titleKey: 'home.highlights.billing.title',
    descKey: 'home.highlights.billing.desc'
  }
] as const

const gatewayMetrics = [
  {
    labelKey: 'home.gatewayPanel.metricEndpoint',
    valueKey: 'home.gatewayPanel.metricEndpointValue'
  },
  {
    labelKey: 'home.gatewayPanel.metricPool',
    valueKey: 'home.gatewayPanel.metricPoolValue'
  },
  {
    labelKey: 'home.gatewayPanel.metricLatency',
    valueKey: 'home.gatewayPanel.metricLatencyValue'
  }
] as const

const commercialFeatures = [
  {
    icon: 'server',
    titleKey: 'home.features.unifiedGateway',
    descKey: 'home.features.unifiedGatewayDesc'
  },
  {
    icon: 'shield',
    titleKey: 'home.features.multiAccount',
    descKey: 'home.features.multiAccountDesc'
  },
  {
    icon: 'creditCard',
    titleKey: 'home.features.balanceQuota',
    descKey: 'home.features.balanceQuotaDesc'
  }
] as const

const providers = [
  {
    initial: 'C',
    name: 'Claude',
    status: 'supported',
    accent: 'bg-gradient-to-br from-orange-400 to-orange-500'
  },
  {
    initial: 'G',
    name: 'GPT',
    status: 'supported',
    accent: 'bg-gradient-to-br from-emerald-500 to-green-600'
  },
  {
    initial: 'G',
    name: 'Gemini',
    status: 'supported',
    accent: 'bg-gradient-to-br from-blue-500 to-blue-600'
  },
  {
    initial: 'A',
    name: 'Antigravity',
    status: 'supported',
    accent: 'bg-gradient-to-br from-rose-500 to-pink-600'
  },
  {
    initial: '+',
    name: 'More',
    status: 'soon',
    accent: 'bg-gradient-to-br from-slate-500 to-slate-600'
  }
] as const

// Auth state
const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAdmin = computed(() => authStore.isAdmin)
const dashboardPath = computed(() => isAdmin.value ? '/admin/dashboard' : '/dashboard')
const userInitial = computed(() => {
  const user = authStore.user
  if (!user || !user.email) return ''
  return user.email.charAt(0).toUpperCase()
})

// Current year for footer
const currentYear = computed(() => new Date().getFullYear())

let cleanupHomeCopyHandler: (() => void) | null = null

async function copyText(text: string) {
  const value = text.trim()
  if (!value) return false

  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.setAttribute('readonly', 'true')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return success
  }
}

async function handleHomeCopyClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  const button = target?.closest<HTMLElement>('[data-copy-text], [data-copy-target]')
  if (!button) return

  const copyTarget = button.getAttribute('data-copy-target')
  const copyTextValue = button.getAttribute('data-copy-text')
  let textToCopy = copyTextValue || ''

  if (copyTarget) {
    const container = customHomeRoot.value
    const source = container?.querySelector<HTMLElement>(copyTarget)
    textToCopy = source?.innerText || source?.textContent || textToCopy
  }

  if (!textToCopy) return

  const originalLabel = button.textContent || '复制'
  const copied = await copyText(textToCopy)
  if (!copied) return

  button.textContent = '已复制'
  button.setAttribute('aria-live', 'polite')
  window.setTimeout(() => {
    button.textContent = originalLabel
  }, 1500)
}

async function bindHomeCopyHandlers() {
  cleanupHomeCopyHandler?.()
  cleanupHomeCopyHandler = null

  if (!hasHomeContent.value || isHomeContentUrl.value) return

  await nextTick()
  const root = customHomeRoot.value
  if (!root) return

  root.addEventListener('click', handleHomeCopyClick)
  cleanupHomeCopyHandler = () => {
    root.removeEventListener('click', handleHomeCopyClick)
  }
}

// Toggle theme
function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// Initialize theme
function initTheme() {
  const savedTheme = localStorage.getItem('theme')
  if (
    savedTheme === 'dark' ||
    (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
}

onMounted(() => {
  initTheme()

  // Check auth state
  authStore.checkAuth()

  // Ensure public settings are loaded (will use cache if already loaded from injected config)
  if (!appStore.publicSettingsLoaded) {
    appStore.fetchPublicSettings()
  }

  void bindHomeCopyHandlers()
})

watch([hasHomeContent, isHomeContentUrl, homeContent], () => {
  void bindHomeCopyHandlers()
})

onBeforeUnmount(() => {
  cleanupHomeCopyHandler?.()
})
</script>
