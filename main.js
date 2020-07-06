const { app, BrowserWindow, ipcMain } = require('electron')
const { initConfig } = require('./src/config')
const path = require('path')
const URL = require('url').URL
const {clipboard} = require('electron')

let ioHook = false

try {
  ioHook = require('iohook')
} catch(e) {
  ioHook = false
}

'use strict';

let mainWindow
let logWindow
let devMode = false
let selfMute = false
let isConnected = false
let webViewSession = null
let isTalking = false
let muteTimeout = null
let configObj
let micPermissionGranted = false


// Set Dev mode
if (process.argv.length === 3) {
  if (process.argv[2] === 'dev'){
    devMode = true
  }
}

function unmuteMic() {
  if ( selfMute === false){
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
    mainWindow.setTitle("MIC CLOSED")
  }
}

function createMainWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1230,
    height: 800,
    icon: './views/assets/icon.ico',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // https://electronjs.org/docs/tutorial/security#2-do-not-enable-nodejs-integration-for-remote-content
      enableRemoteModule: false, // https://electronjs.org/docs/tutorial/security#15-disable-the-remote-module
      partition: 'persist:discord',
      webviewTag: true
    },
    frame: false
  })

  if (devMode === false){
    mainWindow.setMenu(null)
  }

  mainWindow.loadFile('./views/index.html')
  
  mainWindow.setTitle("Discord Sandboxed")

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

function createLogWindow() {
  logWindow = new BrowserWindow({
    width: 700,
    height: 400,
    icon: './views/assets/icon.ico',
    webPreferences: {
      preload: path.join(__dirname, 'logload.js'),
      nodeIntegration: false, // https://electronjs.org/docs/tutorial/security#2-do-not-enable-nodejs-integration-for-remote-content
      enableRemoteModule: false, // https://electronjs.org/docs/tutorial/security#15-disable-the-remote-module
      partition: 'persist:discord'
    },
    frame: false
  })
  
  if (devMode === false){
    logWindow.setMenu(null)
  }

  logWindow.loadFile('./views/log.html')
  logWindow.setTitle("Logs")
  logWindow.on('closed', function () {
    logWindow = null
  })
}

function maximizeMinimizeState(windowName){
  if (windowName.isMaximized()) {
    windowName.unmaximize()
  } else {
    windowName.maximize()
  }
}

app.on('ready', createMainWindow)


if (devMode) {
  app.on('ready', createLogWindow)
}

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createMainWindow()
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

  if (logWindow) {
    if (logWindow.isMinimized()) mainWindow.restore()
    logWindow.focus()
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
    console.log(`web-contents-created: ${params.src}`)
    // Verify discord.com is being loaded
    if (!params.src.startsWith('https://discord.com/')) {
      event.preventDefault()
    }
  })
})

app.on('web-contents-created', (event, contents) => { // https://electronjs.org/docs/tutorial/security#12-disable-or-limit-navigation
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    console.log(`will-navigate ${navigationUrl}`)
    if (parsedUrl.origin !== 'https://discord.com/') { // Limit navigation to discordapp.com; not really relevant
      event.preventDefault()
    }
  })
})

app.on('web-contents-created', (event, contents) => { // https://electronjs.org/docs/tutorial/security#13-disable-or-limit-creation-of-new-windows
  contents.on('new-window', async (event, navigationUrl) => {
    clipboard.writeText(navigationUrl, 'selection') // I really hope this is safe to do. Could also do a little URL cleaning here to remove trackers
    console.log(`URL ${navigationUrl.toString().slice(0, 20)} Copied to Clipboard`)
    mainWindow.webContents.send('URLCopied', null)
    //event.preventDefault() // Prevents external links from opening
  })
})
/*  ----  */

/*
app.on ('browser-window-blur', function (event, browserWindow)
{
    browserWindow.setOpacity (0.6);
})

app.on ('browser-window-focus', function (event, browserWindow)
{
    browserWindow.setOpacity (1.0);
})*/

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

ipcMain.on('asynchronous-message', (event, _data) => {
  let msg = _data.msg
  if (msg === 'connected') {
    console.log("User connected to Discord VOIP server")
    if (micPermissionGranted === false && selfMute === false){
      micPermissionGranted = true
    }
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

  if (msg === 'blockUpdate') {
    if (logWindow){
      logWindow.webContents.send('blockUpdate', _data.data)
    }
  }

  if (msg === 'minimizeApplication') {
    if (_data.data.wName === 0) {
      mainWindow.minimize()
    }
    if (_data.data.wName === 1) {
      logWindow.minimize()
    }
  }

  if (msg === 'maximizeApplication') {
    if (_data.data.wName === 0) {
      maximizeMinimizeState(mainWindow)
    }
    if (_data.data.wName === 1) {
      maximizeMinimizeState(logWindow)
    }
  }

  if (msg === 'closeApplication') {
    if (_data.data.wName === 0) {
      app.quit()
    }
    if (_data.data.wName === 1) {
      logWindow.close()
    }
  }

  if (msg === 'openLog') {
    if (logWindow) {
      if (logWindow.isMinimized()) mainWindow.restore()
      logWindow.focus()
    }else {
      createLogWindow()
      logWindow.center()
    }
  }

})

app.on('ready', event => {
  if (ioHook) {
    ioHook.start();
  }

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

if (ioHook) {
  ioHook.on('mousedown', event => {
    if (event.button == configObj.key && (micPermissionGranted === true) && (isConnected === true)) {
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
}
