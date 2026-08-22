import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

type NavigationGuard = (
  to: Record<string, any>,
  from: Record<string, any>,
  next: ReturnType<typeof vi.fn>
) => Promise<void>

const routerHarness = vi.hoisted(() => ({
  guard: null as NavigationGuard | null,
}))

const authStore = vi.hoisted(() => ({
  checkAuth: vi.fn(),
  isAuthenticated: true,
  isAdmin: false,
  isSimpleMode: false,
  hasPendingAuthSession: false,
}))

const appStore = vi.hoisted(() => ({
  siteName: 'JKAPI',
  backendModeEnabled: false,
  publicSettingsLoaded: false,
  cachedPublicSettings: null as null | {
    payment_enabled?: boolean
    risk_control_enabled?: boolean
    model_plaza_enabled?: boolean
    model_plaza_require_auth?: boolean
    custom_menu_items?: []
  },
  fetchPublicSettings: vi.fn(),
}))

vi.mock('vue-router', () => ({
  createWebHistory: vi.fn(() => ({})),
  createRouter: vi.fn(() => ({
    beforeEach: vi.fn((guard: NavigationGuard) => {
      routerHarness.guard = guard
    }),
    afterEach: vi.fn(),
    onError: vi.fn(),
  })),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStore,
}))

vi.mock('@/stores/app', () => ({
  useAppStore: () => appStore,
}))

vi.mock('@/stores/adminSettings', () => ({
  useAdminSettingsStore: () => ({ customMenuItems: [] }),
}))

vi.mock('@/stores/adminCompliance', () => ({
  useAdminComplianceStore: () => ({
    initialized: true,
    fetchStatus: vi.fn(),
    requireAcknowledgement: vi.fn(),
  }),
}))

vi.mock('@/composables/useNavigationLoading', () => ({
  useNavigationLoadingState: () => ({
    startNavigation: vi.fn(),
    endNavigation: vi.fn(),
    isLoading: { value: false },
  }),
}))

vi.mock('@/composables/useRoutePrefetch', () => ({
  useRoutePrefetch: () => ({
    triggerPrefetch: vi.fn(),
    cancelPendingPrefetch: vi.fn(),
    resetPrefetchState: vi.fn(),
  }),
}))

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

function runGuard(meta: Record<string, unknown>, path: string) {
  if (!routerHarness.guard) {
    throw new Error('router guard was not registered')
  }

  const next = vi.fn()
  const navigation = routerHarness.guard(
    {
      path,
      fullPath: path,
      name: 'FeatureRoute',
      params: {},
      meta: { requiresAuth: true, ...meta },
    },
    {},
    next
  )
  return { navigation, next }
}

describe('feature route guard', () => {
  beforeAll(async () => {
    await import('@/router')
  })

  beforeEach(() => {
    authStore.isAuthenticated = true
    authStore.isAdmin = false
    authStore.isSimpleMode = false
    authStore.hasPendingAuthSession = false
    appStore.backendModeEnabled = false
    appStore.publicSettingsLoaded = false
    appStore.cachedPublicSettings = null
    appStore.fetchPublicSettings.mockReset()
  })

  it('waits for the first public-settings request before deciding payment access', async () => {
    const deferred = createDeferred<{ payment_enabled: boolean }>()
    appStore.fetchPublicSettings.mockImplementation(async () => {
      const settings = await deferred.promise
      appStore.cachedPublicSettings = settings
      appStore.publicSettingsLoaded = true
      return settings
    })

    const { navigation, next } = runGuard({ requiresPayment: true }, '/purchase')

    await vi.waitFor(() => expect(appStore.fetchPublicSettings).toHaveBeenCalledTimes(1))
    expect(next).not.toHaveBeenCalled()

    deferred.resolve({ payment_enabled: true })
    await navigation
    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith()
  })

  it.each([
    ['payment', { requiresPayment: true }, '/purchase'],
    ['risk control', { requiresRiskControl: true }, '/admin/risk-control'],
  ])('does not treat a failed %s settings load as explicitly disabled', async (_name, meta, path) => {
    authStore.isAdmin = meta.requiresRiskControl === true
    appStore.fetchPublicSettings.mockResolvedValue(null)

    const { navigation, next } = runGuard(meta, path)
    await navigation

    expect(appStore.publicSettingsLoaded).toBe(false)
    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith()
  })

  it.each([
    ['payment', { requiresPayment: true }, { payment_enabled: false }, '/dashboard'],
    [
      'risk control',
      { requiresRiskControl: true },
      { risk_control_enabled: false },
      '/admin/settings',
    ],
  ])('redirects when loaded settings explicitly disable %s', async (_name, meta, settings, target) => {
    authStore.isAdmin = meta.requiresRiskControl === true
    appStore.cachedPublicSettings = settings
    appStore.publicSettingsLoaded = true

    const { navigation, next } = runGuard(meta, '/feature')
    await navigation

    expect(appStore.fetchPublicSettings).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith(target)
  })

  it('allows a regular user to open model plaza in backend mode', async () => {
    authStore.isAuthenticated = true
    authStore.isAdmin = false
    appStore.backendModeEnabled = true
    appStore.cachedPublicSettings = {
      model_plaza_enabled: true,
      model_plaza_require_auth: false,
    }
    appStore.publicSettingsLoaded = true

    const { navigation, next } = runGuard({ requiresAuth: false }, '/model-plaza')
    await navigation

    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith()
  })

  it('allows anonymous model plaza access in backend mode when login is optional', async () => {
    authStore.isAuthenticated = false
    authStore.isAdmin = false
    appStore.backendModeEnabled = true
    appStore.cachedPublicSettings = {
      model_plaza_enabled: true,
      model_plaza_require_auth: false,
    }
    appStore.publicSettingsLoaded = true

    const { navigation, next } = runGuard({ requiresAuth: false }, '/model-plaza')
    await navigation

    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith()
  })

  it('still requires login for anonymous model plaza access when configured', async () => {
    authStore.isAuthenticated = false
    authStore.isAdmin = false
    appStore.backendModeEnabled = true
    appStore.cachedPublicSettings = {
      model_plaza_enabled: true,
      model_plaza_require_auth: true,
    }
    appStore.publicSettingsLoaded = true

    const { navigation, next } = runGuard({ requiresAuth: false }, '/model-plaza')
    await navigation

    expect(next).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/model-plaza' },
    })
  })
})
