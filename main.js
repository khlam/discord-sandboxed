const { app, BrowserWindow, ipcMain } = require('electron')
const { initConfig } = require('./src/config')
const path = require('path')
const ioHook = require('iohook')
const URL = require('url').URL

'use strict';

let mainWindow
let devMode = false
let selfMute = false
let isConnected = false
let webViewSession = null
let isTalking = false
let muteTimeout = null
let configObj
let micPermissionGranted = false

function unmuteMic() {
  if ( selfMute === false ){
    isTalking = true
    console.log("Talking")
    mainWindow.webContents.send('micOpen', 'mic-open')
    mainWindow.setTitle("MIC OPEN")
  }
}

function muteMic() {
  if (selfMute === false) {
    console.log("Not Talking")
    mainWindow.webContents.send('micClose', 'mic-closed')
    mainWindow.setTitle("MUTED")
  }
}

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
      partition: 'persist:discord',
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

  mainWindow.loadFile('index.html') // and load the index.html of the app.

  mainWindow.on('closed', function () {
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

// Force single instance
let isSingleInstance = app.requestSingleInstanceLock()
if (!isSingleInstance) {
  app.quit()
}
// Force focus on single instance
app.on('second-instance', (event, argv, cwd) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

/* Security Stuff */

app.on('web-contents-created', (event, contents) => { // https://electronjs.org/docs/tutorial/security#11-verify-webview-options-before-creation
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    // Strip away preload scripts if unused or verify their location is legitimate
    delete webPreferences.preload
    delete webPreferences.preloadURL

    // Disable Node.js integration
    webPreferences.nodeIntegration = false

    // Verify discordapp.com is being loaded
    if (!params.src.startsWith('https://discord.com/')) {
      event.preventDefault()
    }
  })
})

app.on('web-contents-created', (event, contents) => { // https://electronjs.org/docs/tutorial/security#12-disable-or-limit-navigation
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)

    if (parsedUrl.origin !== 'https://discord.com/') { // Limit navigation to discordapp.com; not really relevant
      event.preventDefault()
    }
  })
})

app.on('web-contents-created', (event, contents) => { // https://electronjs.org/docs/tutorial/security#13-disable-or-limit-creation-of-new-windows
  contents.on('new-window', async (event, navigationUrl) => {
    event.preventDefault() // Prevents external links from opening
  })
})
/*  ----  */

app.on('ready', () => {
  // Handle permission requests
  webViewSession = mainWindow.webContents.session
  webViewSession.setPermissionRequestHandler((webContents, permission, callback) => { // deny all permissions
      const url = webContents.getURL()
      if (url.startsWith('https://discord.com/')) {
        if (permission === 'media' && isConnected === true) { // if user is connected to Discord voice then enable microphone
          console.log("User connected to Discord VOIP server. Granted permission for microphone")
          micPermissionGranted = true
          return callback(true)
        }
      }
      console.log("Denied permission: ", permission)
      return callback(false)
  })
})

ipcMain.on('asynchronous-message', (event, msg) => {
  if (msg === 'connected') {
    console.log("User connected to Discord VOIP server")
    isConnected = true
  }

  if (msg === 'disconnected') {
    console.log("User disconnected to Discord VOIP server")
    isConnected = false
  }

  if (msg === 'self-muted') {
    console.log("User self-muted")
    webViewSession.setPermissionRequestHandler(null)
    selfMute = true
  }

  if (msg === 'self-unmuted') {
    console.log("User self-unmuted")
    selfMute = false
  }

  if (msg === 'DOMready') {
    mainWindow.webContents.send('devMode', devMode)
  }

  if (msg === 'confirmMicClose') {
    if (isTalking === true) {
      console.log("Mic state desync. Opening Mic.")
      unmuteMic()
    }
  }
})

app.on('ready', event => {
  ioHook.start();

  console.log(`Dev Mode: ${devMode}`)

  initConfig()
    .then(value => {
      configObj = value
      return configObj
    })
    .then(configObj => {
      console.log(configObj)
  })

})

ioHook.on('mousedown', event => {
  if (event.button == configObj.key && (micPermissionGranted === true)) {
    clearTimeout(muteTimeout)
    unmuteMic()
  }
})

ioHook.on('mouseup', event => {
  if (event.button == configObj.key) {
    if (isTalking === true) {
      isTalking = false
      muteTimeout = setTimeout(() => muteMic(), configObj.delay)
    }
  }
})
