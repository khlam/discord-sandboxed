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

let talkOpen = false

function toggleMicOpen() {
  if (talkOpen === false) {
    setTimeout(function (){
      talkOpen = false
      console.log("Muted")
      mainWindow.webContents.send('ping', 'mic-closed')
      mainWindow.setTitle("MUTED")
      microphone.mute();
    }, 2000);
  }else {
    talkOpen = true
    console.log("Talking")
    mainWindow.webContents.send('ping', 'mic-open')
    mainWindow.setTitle("MIC OPEN")
    microphone.unmute();
  } 
}

app.on('ready', event => {
  talkOpen = false
  toggleMicOpen()
  ioHook.start();
  ioHook.start(true);
  console.log("Init done")
})

ioHook.on('mouseclick', event => {
  if (event.button == '4') {
    if (talkOpen === false) {
      talkOpen = true
      toggleMicOpen()
    }
  }
});


ioHook.on('mousedown', event => {
  if (event.button == '4') {
    if (talkOpen === false) {
      talkOpen = true
      toggleMicOpen()
    }
  }
})


ioHook.on('mouseup', event => {
  if (event.button == '4') {
    if (talkOpen === true) {
      talkOpen = false
      toggleMicOpen()
    }
  }
})