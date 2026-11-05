import { join } from 'path'
import { BrowserWindow } from 'electron'
import { sendState } from './store'

let win: BrowserWindow | null = null

// A normal framed window; the overlays can't take keyboard focus, so settings live here.
export function openSettings(onClosed: () => void) {
  if (win) {
    win.show()
    win.focus()
    return
  }

  win = new BrowserWindow({
    width: 480,
    height: 720,
    minWidth: 400,
    minHeight: 400,
    title: 'Pauta Settings',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  win.setMenu(null)
  win.once('ready-to-show', () => win?.show())
  win.webContents.on('did-finish-load', () => win && sendState(win.webContents))
  win.on('closed', () => {
    win = null
    onClosed()
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/settings/index.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/settings/index.html'))
  }
}
