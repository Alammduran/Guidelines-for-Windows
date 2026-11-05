import { create } from 'zustand'
import { DEFAULT_SETTINGS, type Guide, type Settings, type ShortcutId } from '../../types/model'

interface MirroredState {
  guides: Guide[]
  selectedId: string | null
  settings: Settings
  failedShortcuts: ShortcutId[]
}

// Mirrors main's state (used by both the overlays and the settings window).
// The only local write is the optimistic position during a drag.
export const useStore = create<MirroredState>(() => ({
  guides: [],
  selectedId: null,
  settings: DEFAULT_SETTINGS,
  failedShortcuts: []
}))

window.pauta.onGuides((guides) => useStore.setState({ guides }))
window.pauta.onSelected((selectedId) => useStore.setState({ selectedId }))
window.pauta.onSettings((settings) => useStore.setState({ settings }))
window.pauta.onShortcutFailures((failedShortcuts) => useStore.setState({ failedShortcuts }))

export function setLocalPosition(id: string, position: number) {
  useStore.setState((s) => ({ guides: s.guides.map((g) => (g.id === id ? { ...g, position } : g)) }))
}
