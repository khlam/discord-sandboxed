const { ipcRenderer } = require('electron')

// Send commands from main to renderer
ipcRenderer.on('devMode', (event, msg) => {
  console.log(`PRELOAD: Dev Mode: ${msg}`)
  window.postMessage({ type: "devMode", text: `${msg}` }, "*")
})

ipcRenderer.on('micOpen', (event, msg) => {
  window.postMessage({ type: "micOpen"}, "*")
})

ipcRenderer.on('micClose', (event, msg) => {
  window.postMessage({ type: "micClose"}, "*")
})


ipcRenderer.on('URLCopied', (event, msg) => {
  window.postMessage({ type: "URLCopied"}, "*")
})

// Handle events sent from renderer, sends it to main
window.addEventListener("DOMContentLoaded", () => {
  ipcRenderer.send('asynchronous-message', {msg: 'DOMready'})
})

window.addEventListener(
  "message",
  event => {
    if (event.origin === "file://" && event.source === window) {

      if (event.data.type === 'connected'){
        ipcRenderer.send('asynchronous-message', {msg: 'connected'})
      }
      
      if (event.data.type === 'disconnected'){
        ipcRenderer.send('asynchronous-message', {msg: 'disconnected'})
      }

      if (event.data.type === 'self-muted'){
        ipcRenderer.send('asynchronous-message', {msg:'self-muted'})
      }

      if (event.data.type === 'self-unmuted'){
        ipcRenderer.send('asynchronous-message', {msg: 'self-unmuted'})
      }

      if (event.data.type === 'confirmMicOpen'){
        ipcRenderer.send('asynchronous-message', {msg: 'confirmMicOpen'})
      }

      if (event.data.type === 'confirmMicClose'){
        ipcRenderer.send('asynchronous-message', {msg: 'confirmMicClose'})
      }

      if (event.data.type === 'blockUpdate'){
        ipcRenderer.send('asynchronous-message', {msg: 'blockUpdate', data: event.data.payload})
      }

      if (event.data.type === 'minimizeApplication'){
        ipcRenderer.send('asynchronous-message', {msg: 'minimizeApplication', data: event.data.payload})
      }

      if (event.data.type === 'maximizeApplication'){
        ipcRenderer.send('asynchronous-message', {msg: 'maximizeApplication', data: event.data.payload})
      }

      if (event.data.type === 'closeApplication'){
        ipcRenderer.send('asynchronous-message', {msg: 'closeApplication', data: event.data.payload})
      }

      if (event.data.type === 'openLog'){
        ipcRenderer.send('asynchronous-message', {msg: 'openLog'})
      }
    }
  },
  false
)