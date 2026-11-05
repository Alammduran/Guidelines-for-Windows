import { useState } from 'react'
import { DEFAULT_SHORTCUTS, getBindings, type Settings, type ShortcutId } from '../../types/model'
import { useStore } from '../overlay/store'
import { toAccelerator } from './accelerator'

const SHORTCUT_LABELS: Record<ShortcutId, string> = {
  toggleVisible: 'Show / hide guides',
  toggleLocked: 'Lock / unlock guides',
  addHorizontal: 'New horizontal guide',
  addVertical: 'New vertical guide',
  deleteSelected: 'Delete selected guide',
  nudgeUp: 'Nudge up 1px',
  nudgeDown: 'Nudge down 1px',
  nudgeLeft: 'Nudge left 1px',
  nudgeRight: 'Nudge right 1px',
  nudgeUp10: 'Nudge up 10px',
  nudgeDown10: 'Nudge down 10px',
  nudgeLeft10: 'Nudge left 10px',
  nudgeRight10: 'Nudge right 10px'
}

const update = (patch: Partial<Settings>) => window.pauta.updateSettings(patch)

export default function App() {
  const { settings, failedShortcuts } = useStore()
  const bindings = getBindings(settings)

  const setShortcut = (id: ShortcutId, accelerator: string | undefined) => {
    const { [id]: _, ...rest } = settings.shortcuts
    update({ shortcuts: accelerator && accelerator !== DEFAULT_SHORTCUTS[id] ? { ...rest, [id]: accelerator } : rest })
  }

  return (
    <main>
      <div>
        <h2>Appearance</h2>
        <section>
          <label className="row">
            <span className="label">Line color</span>
            <input
              type="color"
              value={settings.defaultColor}
              onChange={(e) => update({ defaultColor: e.target.value.toUpperCase() })}
            />
          </label>
          <label className="row">
            <span className="label">Opacity</span>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={settings.opacity}
              onChange={(e) => update({ opacity: Number(e.target.value) })}
            />
            <output>{Math.round(settings.opacity * 100)}%</output>
          </label>
          <label className="row">
            <span className="label">
              Thickness
              <div className="hint">In physical pixels, so it looks the same at any display scaling.</div>
            </span>
            <input
              type="number"
              min={1}
              max={10}
              value={settings.thicknessPx}
              onChange={(e) => {
                const n = Math.round(Number(e.target.value))
                if (n >= 1 && n <= 10) update({ thicknessPx: n })
              }}
            />
            <span className="hint">px</span>
          </label>
          <div className="row hint">Right-click a guide to give it its own color.</div>
        </section>
      </div>

      <div>
        <h2>General</h2>
        <section>
          <label className="row">
            <span className="label">Launch Pauta when Windows starts</span>
            <input
              type="checkbox"
              checked={settings.launchOnStartup}
              onChange={(e) => update({ launchOnStartup: e.target.checked })}
            />
          </label>
        </section>
      </div>

      <div>
        <h2>Shortcuts</h2>
        <section>
          {(Object.keys(SHORTCUT_LABELS) as ShortcutId[]).map((id) => (
            <ShortcutRow
              key={id}
              label={SHORTCUT_LABELS[id]}
              value={bindings[id]}
              isCustom={id in settings.shortcuts}
              failed={failedShortcuts.includes(id)}
              onChange={(acc) => setShortcut(id, acc)}
              onReset={() => setShortcut(id, undefined)}
            />
          ))}
        </section>
        {Object.keys(settings.shortcuts).length > 0 && (
          <p>
            <button onClick={() => update({ shortcuts: {} })}>Reset all shortcuts</button>
          </p>
        )}
      </div>
    </main>
  )
}

interface ShortcutRowProps {
  label: string
  value: string
  isCustom: boolean
  failed: boolean
  onChange(accelerator: string): void
  onReset(): void
}

function ShortcutRow({ label, value, isCustom, failed, onChange, onReset }: ShortcutRowProps) {
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState('')

  const start = () => {
    setRecording(true)
    setError('')
    // Pauta's own global shortcuts would otherwise swallow the keys being recorded.
    window.pauta.suspendShortcuts(true)
  }
  const stop = () => {
    if (!recording) return
    setRecording(false)
    window.pauta.suspendShortcuts(false)
  }

  return (
    <div className="row">
      <span className="label shortcut-meta">
        {label}
        {failed && <span className="warn">Unavailable: another app (or another action) already uses it</span>}
        {error && <span className="warn">{error}</span>}
      </span>
      {isCustom && !recording && (
        <button className="link" onClick={onReset}>
          Reset
        </button>
      )}
      <button
        className={`key${recording ? ' recording' : ''}`}
        onClick={() => (recording ? stop() : start())}
        onBlur={stop}
        onKeyDown={(e) => {
          if (!recording) return
          e.preventDefault()
          if (e.code === 'Escape') return stop()
          const result = toAccelerator(e)
          if (!result) return
          if ('error' in result) return setError(result.error)
          setError('')
          onChange(result.accelerator)
          stop()
        }}
      >
        {recording ? 'Press a shortcut…' : value}
      </button>
    </div>
  )
}
