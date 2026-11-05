import { Menu, Tray } from 'electron'
import trayIcon from '../../resources/tray.ico?asset'
import trayHiddenIcon from '../../resources/tray-hidden.ico?asset'
import type { Bindings, ShortcutId } from '../types/model'

export interface TrayActions {
  toggleVisible(): void
  toggleLocked(): void
  addHorizontal(): void
  addVertical(): void
  clearAll(): void
  openSettings(): void
  quit(): void
}

export interface TrayState {
  visible: boolean
  locked: boolean
  bindings: Bindings
  failedShortcuts: ShortcutId[]
}

let tray: Tray
let actions: TrayActions

// Created first thing on startup: with guides hidden the tray is the app's only UI.
export function createTray(trayActions: TrayActions) {
  actions = trayActions
  tray = new Tray(trayIcon)
  tray.setToolTip('Pauta')
  tray.on('click', () => tray.popUpContextMenu())
}

export function updateTray({ visible, locked, bindings, failedShortcuts }: TrayState) {
  tray.setImage(visible ? trayIcon : trayHiddenIcon)
  tray.setToolTip(visible ? 'Pauta' : 'Pauta (guides hidden)')

  // Shortcut hints only; the real bindings are global shortcuts.
  const hint = (accelerator: string) => ({ accelerator, registerAccelerator: false })
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show guides', type: 'checkbox', checked: visible, click: actions.toggleVisible, ...hint(bindings.toggleVisible) },
      { label: 'Lock guides', type: 'checkbox', checked: locked, click: actions.toggleLocked, ...hint(bindings.toggleLocked) },
      { type: 'separator' },
      { label: 'Add horizontal guide', click: actions.addHorizontal },
      { label: 'Add vertical guide', click: actions.addVertical },
      { label: 'Clear all guides…', click: actions.clearAll },
      ...(failedShortcuts.length
        ? [
            { type: 'separator' as const },
            { label: `⚠ ${failedShortcuts.length} shortcut(s) unavailable — see Settings`, click: actions.openSettings }
          ]
        : []),
      { type: 'separator' },
      { label: 'Settings…', click: actions.openSettings },
      { label: 'Quit Pauta', click: actions.quit }
    ])
  )
}
