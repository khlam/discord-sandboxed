// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcRenderer} = require('electron')
const path = require('path')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 840,
    icon: './assets/icon.ico',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      webviewTag: true
    }
  })
  mainWindow.setMenu(null)
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

const ioHook = require('iohook')
const win = require('win-audio')
const microphone = win.mic


let isTalking = false

// Resolves the promise after 2 seconds
function muteDelay() {
  return new Promise((resolve) => {
    setTimeout(function(){
      return resolve(true)
    }, 1300);
  })
}

// Mutes the Mic
function muteMic() {
  return new Promise((resolve) => {
    if (isTalking === false) {
      muteDelay().then(val => {
        if (isTalking === false) {
          microphone.mute(); // Mute mic
          console.log("Muted")
          mainWindow.webContents.send('ping', 'mic-closed')
          mainWindow.setTitle("MUTED")
          return resolve(true)
        }
      })
    }
  })
}

function unmuteMic() {
  return new Promise((resolve, reject) => {
    console.log("Talking")
    isTalking = true
    mainWindow.webContents.send('ping', 'mic-open')
    mainWindow.setTitle("MIC OPEN")
    microphone.unmute(); // Unmute mic
    return resolve(true)
  })
}

app.on('ready', event => {
  ioHook.start();

  console.log("Init Finished")

  console.log("Muted")
  microphone.mute();
  mainWindow.webContents.send('ping', 'mic-closed')
  mainWindow.setTitle("MUTED")
})

ioHook.on('mousedown', event => {
  if (event.button == '4') {
    unmuteMic()
  }
})

ioHook.on('mouseup', event => {
  if (event.button == '4') {
    isTalking = false
    muteMic()
  }
})


