// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const ioHook = require('iohook')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

let devMode = false

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1230,
    height: 730,
    icon: './assets/icon.ico',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      webviewTag: true
    }
  })
  if (process.argv.length === 3) {
    if (process.argv[2] === 'dev'){
      devMode = true
    }
  }

  if (devMode === false){
    mainWindow.setMenu(null)
  }
  
  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

'use strict';
let selfMute = false
let isConnected = false

function muteMic() {
  console.log("Muted")
  mainWindow.webContents.send('micClose', 'mic-closed')
  mainWindow.setTitle("MUTED")
}

function unmuteMic() {
  if (isConnected === true && selfMute === false) {
    console.log("Talking")
    mainWindow.webContents.send('micOpen', 'mic-open')
    mainWindow.setTitle("MIC OPEN")
  }
}

app.on('ready', event => {
  ioHook.start();
  console.log(`Dev Mode: ${devMode}`)
})

ioHook.on('mousedown', event => {
  if (event.button == '4') {
    unmuteMic()
  }
})

ioHook.on('mouseup', event => {
  if (event.button == '4') {
    muteMic()
  }
})

ipcMain.on('asynchronous-message', (event, msg) => {
  if (msg === 'connected') {
    isConnected = true
    muteMic()
  }

  if (msg === 'disconnected') {
    isConnected = false
  }

  if (msg === 'self-muted') {
    console.log("self-muted")
    selfMute = true
  }

  if (msg === 'self-unmuted') {
    console.log("self-unmuted")
    selfMute = false
  }

  if (msg === 'DOMready') {
    mainWindow.webContents.send('devMode', devMode)
  }
})
