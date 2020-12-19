const { app, BrowserWindow, ipcMain } = require('electron')
const { initConfig, saveConfig } = require('./src/config')
const path = require('path')
const URL = require('url').URL
const {clipboard} = require('electron')
const config = require('./src/config')
let ioHook = null
const { session } = require('electron')

try {
  ioHook = require('iohook')
} catch(e) {
  console.log(e)
  ioHook = false
}

'use strict';

let mainWindow
let logWindow
let settingsWindow

let devMode = false
let selfMute = false
let isConnected = false
let webViewSession = null
let isTalking = false
let muteTimeout = null
let configObj
let micPermissionGranted = false

let isChangingPTTKey = false

let pttEnable = 'mousedown' // init to mousedown/up
let pttDisable = 'mouseup'
let pttWatch = 'button'

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
      preload: path.join(__dirname, 'src/mainLoad.js'),
      nodeIntegration: false, // https://electronjs.org/docs/tutorial/security#2-do-not-enable-nodejs-integration-for-remote-content
      enableRemoteModule: false, // https://electronjs.org/docs/tutorial/security#15-disable-the-remote-module
      partition: 'persist:discord',
      webviewTag: true
    },
    frame: false
  })

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
    resizable: false,
    icon: './views/assets/icon.ico',
    webPreferences: {
      preload: path.join(__dirname, 'src/logLoad.js'),
      nodeIntegration: false,
      enableRemoteModule: false,
    },
    frame: false
  })

  logWindow.loadFile('./views/log.html')
  logWindow.setTitle("Logs")
  logWindow.on('closed', function () {
    logWindow = null
  })
}

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 700,
    height: 400,
    show: true,
    resizable: false,
    alwaysOnTop:true,
    icon: './views/assets/icon.ico',
    webPreferences: {
      preload: path.join(__dirname, 'src/settingsLoad.js'),
      nodeIntegration: false,
      enableRemoteModule: false,
    },
    frame: false
  })

  settingsWindow.loadFile('./views/settings.html')
  settingsWindow.setTitle("Settings")
  settingsWindow.on('closed', function () {
    isChangingPTTKey = false
    settingsWindow = null
  })
}

function maximizeMinimizeState(windowName){
  if (windowName.isMaximized()) {
    windowName.unmaximize()
  } else {
    windowName.maximize()
  }
}

function restartioHook() {
  if (ioHook) {
    console.log("restarting io Hook")
    return new Promise((resolve, reject) => {
      return new Promise((resolve, reject) => {
          ioHook.removeAllListeners('mousedown', () => {})
          ioHook.removeAllListeners('mouseup', () => {})
          ioHook.removeAllListeners('keydown', () => {})
          ioHook.removeAllListeners('keyup', () => {})
          ioHook.unload()
          console.log("ioHook stopped")
          return resolve(true)
      }).then (v => {
        return new Promise((resolve, reject) => {
          ioHook.load()
          console.log("ioHook started")
          return resolve(true)
        }).then(v => {
          ioHook.start()
          return resolve(true)
        })
      })
    })
  }
}

function setPTTKey() {
  if (ioHook && configObj.pttDevice && configObj.pttDevice) {
    console.log("Set PTT Key")
    if (configObj.pttDevice === 'mouse'){
      pttEnable = 'mousedown'
      pttDisable = 'mouseup'
      pttWatch = 'button'
    }
    if (configObj.pttDevice === 'keyboard'){
      pttEnable = 'keydown'
      pttDisable = 'keyup'
      pttWatch = 'keycode'
    }
    ioHook.on(pttEnable, event => {
      if (event[pttWatch] == configObj.key && (micPermissionGranted === true) && (isConnected === true) && (isChangingPTTKey === false)) {
        clearTimeout(muteTimeout)
        unmuteMic()
      }
    })
    
    ioHook.on(pttDisable, event => {
      if (event[pttWatch] == configObj.key) {
        if (isTalking === true) {
          isTalking = false
          muteTimeout = setTimeout(() => muteMic(), configObj.delay)
        }
      }
    })
  }else {
    console.log("Not listening for keypresses. ioHook library error or PTT keys not set.")
  }
}

app.on('ready', createMainWindow)

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


app.on ('browser-window-blur', function (event, browserWindow) {
  browserWindow.webContents.send('unfocused', null)
})

app.on ('browser-window-focus', function (event, browserWindow) {
  browserWindow.webContents.send('focused', null)
})

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
    console.log("Discord webview loaded")
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
    if (_data.data.wName === 2) {
      settingsWindow.minimize()
    }
  }

  if (msg === 'maximizeApplication') {
    if (_data.data.wName === 0) {
      maximizeMinimizeState(mainWindow)
    }
    if (_data.data.wName === 1) {
      maximizeMinimizeState(logWindow)
    }
    if (_data.data.wName === 2) {
      maximizeMinimizeState(settingsWindow)
    }
  }

  if (msg === 'closeApplication') {
    if (_data.data.wName === 0) {
      app.quit()
    }
    if (_data.data.wName === 1) {
      logWindow.close()
    }
    if (_data.data.wName === 2) {
      settingsWindow.close()
    }
  }

  if (msg === 'openLog') {
    if (logWindow) {
      if (logWindow.isMinimized()) logWindow.restore()
      logWindow.focus()
    }else {
      createLogWindow()
      logWindow.center()
    }
  }

  if (msg === 'openSettings') {
    if (settingsWindow) {
      if (settingsWindow.isMinimized()) settingsWindow.restore()
      settingsWindow.focus()
    }else {
      createSettingsWindow()
      settingsWindow.center()
    }
  }

  if (msg === 'SettingsDOMReady') {
    if (settingsWindow) {
      console.log("SettingsDOMReady. Sending Settings DOM obj")
      settingsWindow.webContents.send('settingsObj', configObj)
    }
  }

  if (msg === 'setPTTKey') {
    if (settingsWindow) {
      if (ioHook) {
          isChangingPTTKey = true
          console.log("waiting for user to rebind")
          if (settingsWindow && isChangingPTTKey) {
            
            restartioHook().then(v => {

              mainWindow.blur()
              settingsWindow.showInactivae()

              ioHook.once('keydown', event => {
                if (settingsWindow && isChangingPTTKey) {
                  console.log("rebind success")
                  configObj.pttDevice = 'keyboard'
                  configObj.key = event.keycode
                  isChangingPTTKey = false
                  saveConfig(configObj)
                  settingsWindow.webContents.send('settingsObj', configObj)
                  setPTTKey()
                  settingsWindow.show()
                }
              })
              
              // Ignore using left click (mouse1)
              ioHook.once('mousedown', event => {
                if (settingsWindow && isChangingPTTKey && event.button !== 1) {
                  console.log("rebind success")
                  configObj.pttDevice = 'mouse'
                  configObj.key = event.button
                  isChangingPTTKey = false
                  saveConfig(configObj)
                  settingsWindow.webContents.send('settingsObj', configObj)
                  setPTTKey()
                  settingsWindow.show()
                }
              })
            })
          }
      }
    }
  }

  if (msg === 'cancelSetPTTKey') {
    console.log("cancel set new PTT")
    isChangingPTTKey = false
    saveConfig(configObj)
    settingsWindow.webContents.send('settingsObj', configObj)
  }

  if (msg === 'setPTTDelay') {
    console.log(`New PTT Delay: ${_data.data} ms`)
    configObj.delay = _data.data
    saveConfig(configObj)
    settingsWindow.webContents.send('settingsObj', configObj)
  }

  if (msg === 'disablePTT') {
    if (_data.data === false) {
      console.log(`PTT Disabled`)
      configObj.delay = null
      configObj.key = null
      configObj.pttDevice = null
      saveConfig(configObj)
      settingsWindow.webContents.send('settingsObj', configObj)
    }
    if (_data.data === true) {
      console.log(`PTT Enabled`)
      configObj.delay = 1000
      configObj.key = "none"
      configObj.pttDevice = "none"
      saveConfig(configObj)
      settingsWindow.webContents.send('settingsObj', configObj)
    }

  }

})

app.on('ready', event => {
  console.log(`Dev Mode: ${devMode}`)

  initConfig()
    .then(value => {
      configObj = value
      return configObj
    })
    .then(configObj => {
      console.log(configObj)
      restartioHook().then(v => {
        setPTTKey()
      })
  })
})

