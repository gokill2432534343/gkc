// Copyright (c) 2026 gokill. PolyForm Noncommercial License 1.0.0, see LICENSE.
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerOverlayIpc } from './overlay'
import { registerCrosshairIpc } from './crosshair'
import { registerUpdaterIpc } from './updater'
import { registerObsIpc, stopObsServer } from './obs'
import { registerLadderIpc } from './ladder'
import { registerStreakIpc } from './streak'
import { registerCustomTimersIpc, setCountChangeHandler } from './customTimers'
import { refreshOverlaySize } from './overlay'
import { registerReshadeIpc } from './reshade'
import { registerOverlayProfilesIpc } from './overlayProfiles'
import { registerMapDetectIpc, stopMapDetect } from './mapDetect'
import { registerAutoResultIpc, stopAutoResult } from './autoResult'
import { registerUnhookIpc, stopUnhookWatch } from './unhook'
import { registerMatchIpc } from './match'
import { registerDuelIpc } from './duel'
import { registerTimerIpc } from './timer'
import { registerHotkeys, unregisterHotkeys } from './hotkeys'
import { attachUiScale, registerUiScaleIpc } from './uiScale'
import { registerSettingsIo } from './settingsIO'
import { initLogging, registerLogIpc } from './log'
import { prepareStore, registerStoreIpc } from './store'
import { showSplash, closeSplash } from './splash'
import icon from '../../resources/icon.png?asset'

initLogging()

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1120,
    height: 780,
    show: false,
    autoHideMenuBar: true,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#141416',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#101012', symbolColor: '#9a9aa0', height: 36 },
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  attachUiScale(mainWindow)

  mainWindow.on('ready-to-show', () => {
    closeSplash(() => mainWindow.show())
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    // only normal web links may leave the app
    if (/^https:\/\//i.test(details.url)) shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.gkc.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Snapshot and migrate settings files BEFORE any module loads them.
  prepareStore()
  registerLogIpc()
  registerStoreIpc()

  registerOverlayIpc()
  registerCrosshairIpc()
  setCountChangeHandler(refreshOverlaySize)
  registerStreakIpc()
  registerLadderIpc()
  registerCustomTimersIpc()
  registerReshadeIpc()
  registerMapDetectIpc()
  registerAutoResultIpc()
  registerOverlayProfilesIpc()
  registerUiScaleIpc()
  registerSettingsIo()
  registerObsIpc()
  registerUpdaterIpc()
  registerDuelIpc()
  registerMatchIpc()
  registerUnhookIpc()
  registerTimerIpc()
  registerHotkeys()

  showSplash()
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('will-quit', () => {
  unregisterHotkeys()
  stopObsServer()
  stopMapDetect()
  stopAutoResult()
  stopUnhookWatch()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
