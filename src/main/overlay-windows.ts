import { join } from 'path'
import { BrowserWindow, screen, type Display } from 'electron'
import { getSettings, sendState } from './store'

// One transparent click-through overlay per physical display, keyed by Display.id.
const windows = new Map<number, BrowserWindow>()
// What each renderer's hit test asked for. Lock overrides it without forgetting it.
const wantsInteractive = new WeakMap<BrowserWindow, boolean>()

function applyInteractive(win: BrowserWindow) {
  if (wantsInteractive.get(win) && !getSettings().locked) win.setIgnoreMouseEvents(false)
  else win.setIgnoreMouseEvents(true, { forward: true })
}

export function setInteractive(win: BrowserWindow, interactive: boolean) {
  wantsInteractive.set(win, interactive)
  applyInteractive(win)
}

// Re-apply after the lock setting changes.
export function refreshInteractive() {
  for (const win of windows.values()) applyInteractive(win)
}

export function setOverlaysVisible(visible: boolean) {
  for (const win of windows.values()) {
    if (win.isVisible() === visible) continue
    if (visible) win.showInactive()
    else win.hide()
  }
}

function createOverlay(display: Display) {
  const { bounds } = display
  const win = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    show: getSettings().visible,
    transparent: true,
    backgroundColor: '#00000000',
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    hasShadow: false,
    focusable: false,
    fullscreenable: false,
    acceptFirstMouse: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Re-apply bounds: on mixed-DPI setups Windows can mis-size a window created on a
  // display whose scale differs from the primary's.
  win.setBounds(bounds)
  win.setAlwaysOnTop(true, 'screen-saver')
  win.setIgnoreMouseEvents(true, { forward: true })
  win.webContents.on('did-finish-load', () => sendState(win.webContents))

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/overlay/index.html?displayId=${display.id}`)
  } else {
    win.loadFile(join(__dirname, '../renderer/overlay/index.html'), { query: { displayId: String(display.id) } })
  }

  windows.set(display.id, win)
}

function reconcile() {
  const displays = screen.getAllDisplays()

  // Create/resize first so there is never a moment with zero windows (which would quit the app).
  for (const display of displays) {
    const win = windows.get(display.id)
    if (win) win.setBounds(display.bounds)
    else createOverlay(display)
  }

  // Guides on a removed display stay in the store; they just have no window to render in.
  for (const [id, win] of windows) {
    if (!displays.some((d) => d.id === id)) {
      win.destroy()
      windows.delete(id)
    }
  }
}

export function startOverlays() {
  reconcile()
  screen.on('display-added', reconcile)
  screen.on('display-removed', reconcile)
  screen.on('display-metrics-changed', reconcile)
}
