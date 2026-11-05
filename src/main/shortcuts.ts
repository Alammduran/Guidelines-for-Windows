import { globalShortcut } from 'electron'
import type { Bindings, ShortcutId } from '../types/model'

let failed: ShortcutId[] = []

export function getFailedShortcuts() {
  return failed
}

// Registers every binding and records the ones that could not be registered: usually
// another app owns the combo, or two Pauta actions share it.
export function registerShortcuts(bindings: Bindings, handlers: Record<ShortcutId, () => void>) {
  globalShortcut.unregisterAll()
  failed = []
  for (const id of Object.keys(bindings) as ShortcutId[]) {
    let ok = false
    try {
      ok = globalShortcut.register(bindings[id], handlers[id])
    } catch {} // malformed accelerator
    if (!ok) {
      failed.push(id)
      console.warn(`Could not register shortcut ${bindings[id]} (${id})`)
    }
  }
}
