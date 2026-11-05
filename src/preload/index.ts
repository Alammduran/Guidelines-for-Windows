import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type PautaApi } from '../types/ipc'

const api: PautaApi = {
  displayId: Number(new URLSearchParams(location.search).get('displayId') ?? NaN),
  setInteractive: (interactive) => ipcRenderer.send(IPC.setInteractive, interactive),
  moveGuide: (id, position) => ipcRenderer.send(IPC.move, { id, position }),
  deleteGuide: (id) => ipcRenderer.send(IPC.delete, { id }),
  selectGuide: (id) => ipcRenderer.send(IPC.select, { id }),
  showGuideMenu: (id) => ipcRenderer.send(IPC.guideMenu, { id }),
  updateSettings: (patch) => ipcRenderer.send(IPC.updateSettings, patch),
  suspendShortcuts: (suspend) => ipcRenderer.send(IPC.suspendShortcuts, suspend),
  onGuides: (cb) => ipcRenderer.on(IPC.guides, (_e, guides) => cb(guides)),
  onSelected: (cb) => ipcRenderer.on(IPC.selected, (_e, id) => cb(id)),
  onSettings: (cb) => ipcRenderer.on(IPC.settings, (_e, settings) => cb(settings)),
  onShortcutFailures: (cb) => ipcRenderer.on(IPC.shortcutFailures, (_e, ids) => cb(ids))
}

contextBridge.exposeInMainWorld('pauta', api)
