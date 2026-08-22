import type { CustomMenuItem } from '@/types'

const MODEL_PLAZA_TEXT_MARKERS = [
  '模型广场',
  '模型廣場',
  '模型厂场',
  'model plaza',
  'model-plaza',
  'model_plaza',
]

export function isModelPlazaMenuItem(item: Pick<CustomMenuItem, 'id' | 'label' | 'url' | 'page_slug'>): boolean {
  const searchable = [
    item.id,
    item.label,
    item.url,
    item.page_slug,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()
    .toLowerCase()

  if (MODEL_PLAZA_TEXT_MARKERS.some((marker) => searchable.includes(marker))) {
    return true
  }

  try {
    const url = new URL(item.url, window.location.origin)
    return url.pathname.toLowerCase().includes('model-plaza')
  } catch {
    return false
  }
}
