import type { Guide, Settings, ShortcutId } from './model'

export const IPC = {
  // renderer → main
  setInteractive: 'overlay:set-interactive',
  move: 'guides:move',
  delete: 'guides:delete',
  select: 'guides:select',
  guideMenu: 'guides:context-menu', // main shows a native menu (color, delete) for the guide
  updateSettings: 'settings:update',
  suspendShortcuts: 'shortcuts:suspend', // while the settings window records a new binding
  // main → renderer
  guides: 'state:guides',
  selected: 'state:selected',
  settings: 'state:settings',
  shortcutFailures: 'state:shortcut-failures'
} as const

export interface MovePayload {
  id: string
  position: number
}

export interface IdPayload {
  id: string
}

export interface SelectPayload {
  id: string | null
}

export interface PautaApi {
  displayId: number // the display this overlay window covers (NaN in the settings window)
  setInteractive(interactive: boolean): void
  moveGuide(id: string, position: number): void
  deleteGuide(id: string): void
  selectGuide(id: string | null): void
  showGuideMenu(id: string): void
  updateSettings(patch: Partial<Settings>): void
  suspendShortcuts(suspend: boolean): void
  onGuides(cb: (guides: Guide[]) => void): void
  onSelected(cb: (id: string | null) => void): void
  onSettings(cb: (settings: Settings) => void): void
  onShortcutFailures(cb: (ids: ShortcutId[]) => void): void
}

declare global {
  interface Window {
    pauta: PautaApi
  }
}
