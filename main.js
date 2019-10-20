// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const ioHook = require('iohook')
const URL = require('url').URL

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

let devMode = false

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1230,
    height: 800,
    icon: './assets/icon.ico',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // https://electronjs.org/docs/tutorial/security#2-do-not-enable-nodejs-integration-for-remote-content
      enableRemoteModule: false, // https://electronjs.org/docs/tutorial/security#15-disable-the-remote-module
      webviewTag: true
    }
  })

  // Set Dev mode
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

/* Security Stuff */
// https://electronjs.org/docs/tutorial/security#11-verify-webview-options-before-creation
app.on('web-contents-created', (event, contents) => {
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    // Strip away preload scripts if unused or verify their location is legitimate
    delete webPreferences.preload
    delete webPreferences.preloadURL

    // Disable Node.js integration
    webPreferences.nodeIntegration = false

    // Verify discordapp.com is being loaded
    if (!params.src.startsWith('https://discordapp.com/')) {
      event.preventDefault()
    }
  })
})

// https://electronjs.org/docs/tutorial/security#12-disable-or-limit-navigation
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)

    if (parsedUrl.origin !== 'https://discordapp.com/') { // Limit navigation to discordapp.com; not really relevant
      event.preventDefault()
    }
  })
})

// https://electronjs.org/docs/tutorial/security#13-disable-or-limit-creation-of-new-windows
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', async (event, navigationUrl) => {
    event.preventDefault() // External links just don't open
  })
})
/*  ----  */

'use strict';
let selfMute = false
let isConnected = false

function unmuteMic() {
  if (isConnected === true && selfMute === false) {
    console.log("Talking")
    mainWindow.webContents.send('micOpen', 'mic-open')
    mainWindow.setTitle("MIC OPEN")
  }
}

function muteMic() {
  console.log("Muted")
  mainWindow.webContents.send('micClose', 'mic-closed')
  mainWindow.setTitle("MUTED")
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
    console.log("User connected to Discord VOIP server")
    isConnected = true
    muteMic()
  }

  if (msg === 'disconnected') {
    console.log("User disconnected to Discord VOIP server")
    isConnected = false
  }

  if (msg === 'self-muted') {
    console.log("User self-muted")
    selfMute = true
  }

  if (msg === 'self-unmuted') {
    console.log("User self-unmuted")
    selfMute = false
  }

  if (msg === 'DOMready') {
    mainWindow.webContents.send('devMode', devMode)
  }
})
