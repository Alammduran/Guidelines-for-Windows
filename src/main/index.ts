import { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu, nativeImage, screen } from 'electron'
import { IPC, type IdPayload, type MovePayload, type SelectPayload } from '../types/ipc'
import { getBindings, type Orientation, type Settings, type ShortcutId } from '../types/model'
import { refreshInteractive, setInteractive, setOverlaysVisible, startOverlays } from './overlay-windows'
import { openSettings } from './settings-window'
import { getFailedShortcuts, registerShortcuts } from './shortcuts'
import {
  addGuide,
  broadcast,
  clearGuides,
  deleteGuide,
  deleteSelected,
  getGuide,
  getSettings,
  loadState,
  moveGuide,
  nudgeSelected,
  saveNow,
  selectGuide,
  setGuideColor,
  updateSettings
} from './store'
import { createTray, updateTray } from './tray'

// A second copy would double every overlay and lose every shortcut to the first.
if (!app.requestSingleInstanceLock()) app.exit()

app.setAppUserModelId('com.pauta.app')

const GUIDE_COLORS = [
  ['Red', '#FF3B30'],
  ['Orange', '#FF9500'],
  ['Yellow', '#FFCC00'],
  ['Green', '#34C759'],
  ['Cyan', '#32ADE6'],
  ['Blue', '#007AFF'],
  ['Purple', '#AF52DE'],
  ['Black', '#000000'],
  ['White', '#FFFFFF']
] as const

// 12px colour square with a grey border, for the guide colour menu.
function swatch(hex: string) {
  const size = 12
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  const buf = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const edge = x === 0 || y === 0 || x === size - 1 || y === size - 1
      buf.set(edge ? [128, 128, 128, 255] : [b, g, r, 255], (y * size + x) * 4) // BGRA
    }
  }
  return nativeImage.createFromBitmap(buf, { width: size, height: size })
}

ipcMain.on(IPC.setInteractive, (e, interactive: boolean) => {
  const win = BrowserWindow.fromWebContents(e.sender)
  if (win) setInteractive(win, interactive)
})
ipcMain.on(IPC.move, (_e, { id, position }: MovePayload) => moveGuide(id, position))
ipcMain.on(IPC.delete, (_e, { id }: IdPayload) => deleteGuide(id))
ipcMain.on(IPC.select, (_e, { id }: SelectPayload) => selectGuide(id))
ipcMain.on(IPC.guideMenu, (e, { id }: IdPayload) => {
  const guide = getGuide(id)
  const win = BrowserWindow.fromWebContents(e.sender)
  if (!guide || !win) return
  Menu.buildFromTemplate([
    {
      label: 'Default color',
      type: 'radio',
      checked: !guide.color,
      icon: swatch(getSettings().defaultColor),
      click: () => setGuideColor(id, undefined)
    },
    ...GUIDE_COLORS.map(([label, hex]) => ({
      label,
      type: 'radio' as const,
      checked: guide.color === hex,
      icon: swatch(hex),
      click: () => setGuideColor(id, hex)
    })),
    { type: 'separator' },
    { label: 'Delete guide', click: () => deleteGuide(id) }
  ]).popup({ window: win })
})
ipcMain.on(IPC.updateSettings, (_e, patch: Partial<Settings>) => changeSettings(patch))
ipcMain.on(IPC.suspendShortcuts, (_e, suspend: boolean) => {
  if (suspend) globalShortcut.unregisterAll()
  else applyShortcuts()
})

function refreshUi() {
  const settings = getSettings()
  setOverlaysVisible(settings.visible)
  refreshInteractive()
  updateTray({
    visible: settings.visible,
    locked: settings.locked,
    bindings: getBindings(settings),
    failedShortcuts: getFailedShortcuts()
  })
}

function applyShortcuts() {
  registerShortcuts(getBindings(getSettings()), shortcutHandlers)
  broadcast(IPC.shortcutFailures, getFailedShortcuts())
  refreshUi()
}

function applyLoginItem() {
  // In dev, execPath is the bare electron.exe; registering it would open an empty Electron at login.
  if (!app.isPackaged) return console.warn('Launch on startup only takes effect in the packaged app')
  app.setLoginItemSettings({
    openAtLogin: getSettings().launchOnStartup,
    // The portable build runs from a temp extraction folder; register the .exe the user actually has.
    path: process.env['PORTABLE_EXECUTABLE_FILE'] ?? process.execPath
  })
}

function changeSettings(patch: Partial<Settings>) {
  updateSettings(patch)
  if (patch.launchOnStartup !== undefined) applyLoginItem()
  if (patch.shortcuts) applyShortcuts()
  // Color/opacity/thickness only reach the renderers; skip rebuilding the tray menu on every slider tick.
  else if (patch.visible !== undefined || patch.locked !== undefined) refreshUi()
}

function toggleVisible() {
  changeSettings({ visible: !getSettings().visible })
}

function toggleLocked() {
  changeSettings({ locked: !getSettings().locked })
}

function showSettings() {
  // Closing mid-recording must not leave the shortcuts suspended.
  openSettings(applyShortcuts)
}

function addGuideOn(orientation: Orientation, displayId: number, position: number) {
  addGuide(displayId, orientation, position)
  // Creating a guide you can't see would be confusing.
  if (!getSettings().visible) toggleVisible()
}

function addGuideAtCursor(orientation: Orientation) {
  const cursor = screen.getCursorScreenPoint()
  const { id, bounds } = screen.getDisplayNearestPoint(cursor)
  addGuideOn(orientation, id, orientation === 'horizontal' ? cursor.y - bounds.y : cursor.x - bounds.x)
}

function addGuideAtCenter(orientation: Orientation) {
  const { id, bounds } = screen.getPrimaryDisplay()
  addGuideOn(orientation, id, Math.round((orientation === 'horizontal' ? bounds.height : bounds.width) / 2))
}

async function clearAll() {
  const { response } = await dialog.showMessageBox({
    type: 'warning',
    title: 'Pauta',
    message: 'Remove all guides?',
    detail: 'This also removes guides on monitors that are not connected right now.',
    buttons: ['Clear all', 'Cancel'],
    defaultId: 1,
    cancelId: 1
  })
  if (response === 0) clearGuides()
}

// Editing shortcuts do nothing while guides are hidden or locked.
function whenEditable(fn: () => void) {
  return () => {
    const { visible, locked } = getSettings()
    if (visible && !locked) fn()
  }
}

const shortcutHandlers: Record<ShortcutId, () => void> = {
  toggleVisible,
  toggleLocked,
  addHorizontal: () => addGuideAtCursor('horizontal'),
  addVertical: () => addGuideAtCursor('vertical'),
  deleteSelected: whenEditable(deleteSelected),
  nudgeUp: whenEditable(() => nudgeSelected('horizontal', -1)),
  nudgeDown: whenEditable(() => nudgeSelected('horizontal', 1)),
  nudgeLeft: whenEditable(() => nudgeSelected('vertical', -1)),
  nudgeRight: whenEditable(() => nudgeSelected('vertical', 1)),
  nudgeUp10: whenEditable(() => nudgeSelected('horizontal', -10)),
  nudgeDown10: whenEditable(() => nudgeSelected('horizontal', 10)),
  nudgeLeft10: whenEditable(() => nudgeSelected('vertical', -10)),
  nudgeRight10: whenEditable(() => nudgeSelected('vertical', 10))
}

app.whenReady().then(() => {
  createTray({
    toggleVisible,
    toggleLocked,
    addHorizontal: () => addGuideAtCenter('horizontal'),
    addVertical: () => addGuideAtCenter('vertical'),
    clearAll,
    openSettings: showSettings,
    quit: () => app.quit()
  })
  loadState()
  startOverlays()
  applyShortcuts()
  // Keep Windows' startup entry in sync with the saved setting (e.g. after moving the portable exe).
  if (app.isPackaged) applyLoginItem()
})

// Launching Pauta again while it runs opens its settings instead.
app.on('second-instance', showSettings)

// The tray keeps the app alive; quitting is explicit.
app.on('window-all-closed', () => {})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  saveNow() // flush any change still inside the debounce window
})
