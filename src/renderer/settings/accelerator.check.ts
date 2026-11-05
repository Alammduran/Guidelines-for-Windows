// Self-check: node --experimental-strip-types src/renderer/settings/accelerator.check.ts
import assert from 'node:assert/strict'
import { toAccelerator, type KeyInput } from './accelerator.ts'

const key = (code: string, mods: Partial<KeyInput> = {}): KeyInput => ({
  code,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  metaKey: false,
  ...mods
})

assert.deepEqual(toAccelerator(key('KeyG', { altKey: true })), { accelerator: 'Alt+G' })
assert.deepEqual(toAccelerator(key('ArrowUp', { ctrlKey: true, altKey: true, shiftKey: true })), {
  accelerator: 'Ctrl+Alt+Shift+Up'
})
assert.deepEqual(toAccelerator(key('Backspace', { altKey: true, shiftKey: true })), { accelerator: 'Alt+Shift+Backspace' })
assert.deepEqual(toAccelerator(key('Digit3', { metaKey: true })), { accelerator: 'Super+3' })
assert.deepEqual(toAccelerator(key('F8')), { accelerator: 'F8' })
assert.equal(toAccelerator(key('AltLeft', { altKey: true })), null)
assert.ok('error' in toAccelerator(key('KeyA'))!)
assert.ok('error' in toAccelerator(key('KeyA', { shiftKey: true }))!)
assert.ok('error' in toAccelerator(key('IntlBackslash', { altKey: true }))!)

console.log('accelerator: ok')
