// Modules to control application life and create native browser window
import { app, BrowserWindow } from 'electron'
import { modInput } from './src/modInput'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
export let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 1200, height: 800 })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
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
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const { ipcMain } = require('electron')

// newInput listener
ipcMain.on('newInput', (e, newInput) => {
  console.log('Received new input: ' + newInput)
  const inputObj = modInput(newInput)
  console.log(`inputObj:\t${inputObj}`)
  console.log(inputObj)
  mainWindow.webContents.send('newInputObj', inputObj)
})

// error listener
ipcMain.on('error', (e, errorObj) => {
  console.log('\tSending error message ' + errorObj.error)
  mainWindow.webContents.send('error', errorObj)
})
