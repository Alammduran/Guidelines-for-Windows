export type Orientation = 'horizontal' | 'vertical'

export interface Guide {
  id: string
  displayId: number // Electron Display.id
  orientation: Orientation
  position: number // DIP offset from the display's origin
  color?: string // overrides the global default when set
}

export const DEFAULT_SHORTCUTS = {
  toggleVisible: 'Alt+G',
  toggleLocked: 'Alt+L',
  addHorizontal: 'Alt+Shift+H',
  addVertical: 'Alt+Shift+V',
  deleteSelected: 'Alt+Shift+Backspace',
  nudgeUp: 'Alt+Shift+Up',
  nudgeDown: 'Alt+Shift+Down',
  nudgeLeft: 'Alt+Shift+Left',
  nudgeRight: 'Alt+Shift+Right',
  nudgeUp10: 'Ctrl+Alt+Shift+Up',
  nudgeDown10: 'Ctrl+Alt+Shift+Down',
  nudgeLeft10: 'Ctrl+Alt+Shift+Left',
  nudgeRight10: 'Ctrl+Alt+Shift+Right'
} as const

export type ShortcutId = keyof typeof DEFAULT_SHORTCUTS
export type Bindings = Record<ShortcutId, string>

export interface Settings {
  defaultColor: string
  opacity: number // 0..1
  thicknessPx: number // physical pixels
  locked: boolean
  visible: boolean
  launchOnStartup: boolean
  shortcuts: Partial<Bindings> // user overrides of DEFAULT_SHORTCUTS
}

export const DEFAULT_SETTINGS: Settings = {
  defaultColor: '#FF3B6E',
  opacity: 0.9,
  thicknessPx: 1,
  locked: false,
  visible: true,
  launchOnStartup: false,
  shortcuts: {}
}

export function getBindings(settings: Settings): Bindings {
  return { ...DEFAULT_SHORTCUTS, ...settings.shortcuts }
}

export interface PersistedState {
  version: 1 // bump + migrate when the shape changes
  guides: Guide[]
  settings: Settings
}
