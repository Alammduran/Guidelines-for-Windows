import { randomUUID } from 'crypto'
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { app, BrowserWindow, screen, type WebContents } from 'electron'
import { IPC } from '../types/ipc'
import { DEFAULT_SETTINGS, type Guide, type Orientation, type PersistedState, type Settings } from '../types/model'
import { getFailedShortcuts } from './shortcuts'

const FILE = join(app.getPath('userData'), 'guides.json')
const SAVE_DEBOUNCE_MS = 500

// Single source of truth for guide state. Renderers only mirror it.
let guides: Guide[] = []
let settings: Settings = { ...DEFAULT_SETTINGS }
let selectedId: string | null = null
let saveTimer: NodeJS.Timeout | undefined

function isGuide(g: any): g is Guide {
  return (
    typeof g?.id === 'string' &&
    typeof g.displayId === 'number' &&
    (g.orientation === 'horizontal' || g.orientation === 'vertical') &&
    Number.isFinite(g.position) &&
    (g.color === undefined || typeof g.color === 'string')
  )
}

export function loadState() {
  let text: string
  try {
    text = readFileSync(FILE, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') console.warn(`Could not read ${FILE}:`, err)
    return
  }
  try {
    const data = JSON.parse(text) as PersistedState
    if (data?.version !== 1 || !Array.isArray(data.guides)) throw new Error(`unsupported format (version ${data?.version})`)
    guides = data.guides.filter(isGuide)
    settings = { ...DEFAULT_SETTINGS, ...data.settings }
  } catch (err) {
    // Keep the bad file for inspection instead of overwriting it on the next save.
    console.warn(`Ignoring corrupt ${FILE}, starting empty:`, err)
    try {
      renameSync(FILE, `${FILE}.corrupt`)
    } catch {}
  }
}

export function saveNow() {
  clearTimeout(saveTimer)
  const state: PersistedState = { version: 1, guides, settings }
  try {
    mkdirSync(dirname(FILE), { recursive: true })
    // Write-then-rename so a crash mid-write can't leave a half-written file.
    writeFileSync(`${FILE}.tmp`, JSON.stringify(state, null, 2))
    renameSync(`${FILE}.tmp`, FILE)
  } catch (err) {
    console.warn(`Could not save ${FILE}:`, err)
  }
}

function scheduleSave() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(saveNow, SAVE_DEBOUNCE_MS)
}

export function broadcast(channel: string, payload: unknown) {
  for (const win of BrowserWindow.getAllWindows()) win.webContents.send(channel, payload)
}

export function sendState(wc: WebContents) {
  wc.send(IPC.guides, guides)
  wc.send(IPC.selected, selectedId)
  wc.send(IPC.settings, settings)
  wc.send(IPC.shortcutFailures, getFailedShortcuts())
}

export function getGuide(id: string) {
  return guides.find((g) => g.id === id)
}

export function setGuideColor(id: string, color: string | undefined) {
  guides = guides.map((g) => (g.id === id ? { ...g, color } : g))
  broadcast(IPC.guides, guides)
  scheduleSave()
}

export function addGuide(displayId: number, orientation: Orientation, position: number) {
  const guide: Guide = { id: randomUUID(), displayId, orientation, position }
  guides = [...guides, guide]
  selectedId = guide.id
  broadcast(IPC.guides, guides)
  broadcast(IPC.selected, selectedId)
  scheduleSave()
}

export function moveGuide(id: string, position: number) {
  guides = guides.map((g) => (g.id === id ? { ...g, position } : g))
  broadcast(IPC.guides, guides)
  scheduleSave()
}

export function deleteGuide(id: string) {
  guides = guides.filter((g) => g.id !== id)
  broadcast(IPC.guides, guides)
  if (selectedId === id) selectGuide(null)
  scheduleSave()
}

export function selectGuide(id: string | null) {
  selectedId = id
  broadcast(IPC.selected, selectedId)
}

export function clearGuides() {
  guides = []
  broadcast(IPC.guides, guides)
  selectGuide(null)
  scheduleSave()
}

export function deleteSelected() {
  if (selectedId) deleteGuide(selectedId)
}

// Moves the selected guide along its own axis; arrows for the other axis are ignored.
export function nudgeSelected(orientation: Orientation, delta: number) {
  const g = guides.find((o) => o.id === selectedId)
  if (!g || g.orientation !== orientation) return
  const display = screen.getAllDisplays().find((d) => d.id === g.displayId)
  const max = display ? (orientation === 'horizontal' ? display.bounds.height : display.bounds.width) - 1 : Infinity
  moveGuide(g.id, Math.min(max, Math.max(0, g.position + delta)))
}

export function getSettings() {
  return settings
}

export function updateSettings(patch: Partial<Settings>) {
  settings = { ...settings, ...patch }
  broadcast(IPC.settings, settings)
  scheduleSave()
}
