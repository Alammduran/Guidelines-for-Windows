export interface KeyInput {
  code: string
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean
  metaKey: boolean
}

const NAMED: Record<string, string> = {
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Insert: 'Insert',
  Home: 'Home',
  End: 'End',
  PageUp: 'PageUp',
  PageDown: 'PageDown',
  Space: 'Space',
  Enter: 'Enter',
  Tab: 'Tab',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  Backslash: '\\',
  Backquote: '`'
}

// Uses the physical key (event.code) so the binding doesn't change with keyboard layout or Shift.
function keyFromCode(code: string): string | undefined {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3)
  if (/^Digit\d$/.test(code)) return code.slice(5)
  if (/^F\d{1,2}$/.test(code)) return code
  if (/^Numpad\d$/.test(code)) return `num${code.slice(6)}`
  return NAMED[code]
}

// Turns a keydown into an Electron accelerator. Returns null while only modifiers are held
// (keep listening), or an error for combos that can't or shouldn't be bound.
export function toAccelerator(e: KeyInput): { accelerator: string } | { error: string } | null {
  if (/^(Control|Alt|Shift|Meta)(Left|Right)$/.test(e.code)) return null
  const key = keyFromCode(e.code)
  if (!key) return { error: 'That key can’t be used in a shortcut' }
  // A global shortcut without Ctrl/Alt/Win would swallow that key in every app.
  if (!e.ctrlKey && !e.altKey && !e.metaKey && !/^F\d+$/.test(key)) {
    return { error: 'Include Ctrl, Alt or Win' }
  }
  const mods = [e.ctrlKey && 'Ctrl', e.altKey && 'Alt', e.shiftKey && 'Shift', e.metaKey && 'Super'].filter(Boolean)
  return { accelerator: [...mods, key].join('+') }
}
