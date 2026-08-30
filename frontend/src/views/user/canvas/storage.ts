export type LibraryAssetType = 'text' | 'image' | 'video'

export interface LibraryAsset {
  id: string
  type: LibraryAssetType
  title: string
  content: string
  cover: string
  tags: string[]
  source: string
  note: string
  createdAt: string
}

export interface PromptItem {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  createdAt: string
}

export interface CanvasRecord {
  id: string
  title: string
  nodes: number
  edges: number
  updatedAt: string
}

export interface CanvasExport {
  record: CanvasRecord
  board: Record<string, unknown>
  exportedAt: string
}

const ASSETS_KEY = 'jkapi_canvas_assets_v1'
const PROMPTS_KEY = 'jkapi_canvas_prompts_v1'
const CANVASES_KEY = 'jkapi_canvas_library_v1'
const ACTIVE_CANVAS_KEY = 'jkapi_canvas_active_record'
const LEGACY_BOARD_KEY = 'jkapi_canvas_board_v1'

function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || '') as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

export const canvasStorage = {
  assets: () => read<LibraryAsset[]>(ASSETS_KEY, []),
  saveAssets: (value: LibraryAsset[]) => write(ASSETS_KEY, value),
  prompts: () => read<PromptItem[]>(PROMPTS_KEY, []),
  savePrompts: (value: PromptItem[]) => write(PROMPTS_KEY, value),
  canvases: () => read<CanvasRecord[]>(CANVASES_KEY, []),
  saveCanvases: (value: CanvasRecord[]) => write(CANVASES_KEY, value),
  activeCanvasId: () => localStorage.getItem(ACTIVE_CANVAS_KEY) || '',
  setActiveCanvasId: (id: string) => localStorage.setItem(ACTIVE_CANVAS_KEY, id),
  boardKey: (id: string) => `jkapi_canvas_board_v1:${id}`,
  board: (id: string) => read<Record<string, unknown>>(`jkapi_canvas_board_v1:${id}`, {}),
  saveBoard: (id: string, value: Record<string, unknown>) => write(`jkapi_canvas_board_v1:${id}`, value),
  removeBoard: (id: string) => localStorage.removeItem(`jkapi_canvas_board_v1:${id}`),
  takeLegacyBoard: () => {
    const value = read<Record<string, unknown>>(LEGACY_BOARD_KEY, {})
    localStorage.removeItem(LEGACY_BOARD_KEY)
    return value
  },
}

export function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function downloadJson(filename: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function readJsonFile<T>(file: File): Promise<T> {
  return JSON.parse(await file.text()) as T
}
