import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const componentPath = resolve(dirname(fileURLToPath(import.meta.url)), '../AppSidebar.vue')
const componentSource = readFileSync(componentPath, 'utf8')
const headerPath = resolve(dirname(fileURLToPath(import.meta.url)), '../AppHeader.vue')
const headerSource = readFileSync(headerPath, 'utf8')
const stylePath = resolve(dirname(fileURLToPath(import.meta.url)), '../../../style.css')
const styleSource = readFileSync(stylePath, 'utf8')

describe('AppSidebar custom SVG styles', () => {
  it('does not override uploaded SVG fill or stroke colors', () => {
    expect(componentSource).toContain('.sidebar-svg-icon {')
    expect(componentSource).toContain('color: currentColor;')
    expect(componentSource).toContain('display: block;')
    expect(componentSource).not.toContain('stroke: currentColor;')
    expect(componentSource).not.toContain('fill: none;')
  })
})

describe('AppSidebar scroll position persistence', () => {
  it('binds a template ref to the sidebar nav element', () => {
    expect(componentSource).toContain('ref="sidebarNavRef"')
    expect(componentSource).toContain('sidebar-nav')
  })

  it('declares sidebarNavRef in script setup', () => {
    expect(componentSource).toContain("const sidebarNavRef = ref<HTMLElement | null>(null)")
  })

  it('saves scroll position on beforeUnmount', () => {
    expect(componentSource).toContain('onBeforeUnmount')
    expect(componentSource).toContain('appStore.sidebarScrollTop')
    expect(componentSource).toContain('sidebarNavRef.value.scrollTop')
  })

  it('restores scroll position on mount', () => {
    expect(componentSource).toContain('onMounted')
    expect(componentSource).toContain('appStore.sidebarScrollTop')
    expect(componentSource).toContain('nextTick')
  })
})

describe('AppSidebar model plaza navigation', () => {
  it('does not render model plaza as a sidebar user nav item', () => {
    expect(componentSource).not.toContain('const flagModelPlaza = makeSidebarFlag(FeatureFlags.modelPlaza)')
    expect(componentSource).not.toContain("{ path: '/model-plaza', label: t('nav.modelPlaza')")
  })

  it('keeps model plaza in the header behind the public feature flag', () => {
    expect(headerSource).toContain('const modelPlazaEnabled = computed(() => isFeatureFlagEnabled(FeatureFlags.modelPlaza))')
    expect(headerSource).toContain('v-if="authStore.isAuthenticated && modelPlazaEnabled"')
    expect(headerSource).not.toContain('v-if="user && modelPlazaEnabled && authStore.isAdmin"')
    expect(headerSource).toContain(":to=\"{ path: '/model-plaza', query: { embedded: '1' } }\"")
    expect(headerSource).not.toContain('modelPlazaHeaderTarget')
    expect(headerSource).not.toContain('`/custom/${customItem.id}`')
  })

  it('deduplicates custom menu items that already point at model plaza', () => {
    expect(componentSource).toContain('!isModelPlazaMenuItem(item)')
    expect(componentSource).toContain("import { isModelPlazaMenuItem } from '@/utils/modelPlazaMenu'")
  })
})

describe('AppSidebar header styles', () => {
  it('does not clip the version badge dropdown', () => {
    const sidebarHeaderBlockMatch = styleSource.match(/\.sidebar-header\s*\{[\s\S]*?\n {2}\}/)
    const sidebarBrandBlockMatch = componentSource.match(/\.sidebar-brand\s*\{[\s\S]*?\n\}/)

    expect(sidebarHeaderBlockMatch).not.toBeNull()
    expect(sidebarBrandBlockMatch).not.toBeNull()
    expect(sidebarHeaderBlockMatch?.[0]).not.toContain('@apply overflow-hidden;')
    expect(sidebarBrandBlockMatch?.[0]).not.toContain('overflow: hidden;')
  })
})
