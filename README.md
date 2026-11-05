# Pauta

Guide lines that float above every window on Windows. Pauta puts horizontal and vertical lines on screen and keeps them on top of everything else. Clicks, typing and scrolling still go to the app underneath. It works like the Guides tool in xScope (macOS).

Use it to check that a design mockup in one window lines up with the implementation in another.

## Install

Download one of these from [Releases](https://github.com/Alammduran/Guidelines-for-Windows/releases) (or build them yourself, see below):

- **`Pauta-<version>-setup.exe`**: an installer. Adds a Start menu entry and an uninstaller.
- **`Pauta-<version>-portable.exe`**: a single exe. Nothing to install; run it from anywhere.

### "Windows protected your PC"

Pauta isn't code-signed, so on first run Windows SmartScreen shows a **"Windows protected your PC"** warning. Click **More info → Run anyway**. Windows remembers the choice after that.

A few antivirus engines on VirusTotal may also flag the exe with low-confidence machine-learning detections. Unsigned Electron apps get these routinely, and they don't mean anything is wrong with the build. Signing needs a paid certificate, which is out of scope for this project.

## Using it

Pauta runs from the **system tray** (the pink crossed-lines icon). Click the icon for the menu: show/hide, lock, add guides, clear all, settings and quit.

| Shortcut | Action |
|---|---|
| `Alt+G` | Show / hide all guides |
| `Alt+L` | Lock / unlock (locked guides can't be grabbed) |
| `Alt+Shift+H` | New horizontal guide at the cursor |
| `Alt+Shift+V` | New vertical guide at the cursor |
| `Alt+Shift+Backspace` | Delete the selected guide |
| `Alt+Shift+←/→/↑/↓` | Nudge the selected guide 1px |
| `Ctrl+Alt+Shift+←/→/↑/↓` | Nudge the selected guide 10px |

With the mouse:

- **Drag** a guide to move it. A badge shows its position in pixels from the monitor's top-left corner.
- **Click** a guide to select it, so the nudge and delete shortcuts act on it.
- **Double-click** a guide to delete it.
- **Right-click** a guide to change its color or delete it.

All shortcuts work in every app. Change them in **Settings** (tray menu → Settings…), where you can also set line color, opacity, thickness and launch-on-startup. The default `Alt+Shift+Arrow` nudges replace VS Code's copy-line and expand-selection shortcuts while Pauta runs, so rebind them if you need those.

Guides and settings are saved to `%APPDATA%\pauta\guides.json`. Each guide belongs to the monitor it was created on. Guides on a monitor that's unplugged are kept and come back when you plug it in again.

## Limitations

- Games running in **exclusive fullscreen** draw over Pauta. Borderless-windowed works.
- The overlay sits above the Windows taskbar too. That's intended for a guides tool.
- Windows only.

## Development

```bash
npm install
node node_modules/electron/install.js   # only if npm skipped Electron's download ("Electron uninstall" error)
npm run dev                             # run with hot reload
npm run check                           # shortcut-recorder self-check
npm run dist                            # build dist/Pauta-<version>-setup.exe and -portable.exe
```

Stack: Electron, electron-vite, React 18 and TypeScript, with Zustand for state. How it works:

- One transparent, click-through window per monitor.
- When the cursor comes within 6px of a guide, that window switches to accepting the mouse so the guide can be dragged.
- The main process holds all guide state.

**If the overlays render black** instead of transparent, your GPU driver doesn't handle transparent windows. Call `app.disableHardwareAcceleration()` at the top of `src/main/index.ts`, but only as a last resort, because it makes rendering slower.
