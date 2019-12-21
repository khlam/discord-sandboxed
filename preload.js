const { ipcRenderer } = require('electron')


// Send commands from main to renderer
window.addEventListener("DOMContentLoaded", () => {
  ipcRenderer.send('asynchronous-message', 'DOMready')
})

ipcRenderer.on('devMode', (event, msg) => {
  console.log(`Dev Mode: ${msg}`)
  window.postMessage({ type: "devMode", text: `${msg}` }, "*")
})

ipcRenderer.on('micOpen', (event, msg) => {
  window.postMessage({ type: "micOpen"}, "*")
})

ipcRenderer.on('micClose', (event, msg) => {
  window.postMessage({ type: "micClose"}, "*")
})

// Handle events sent from renderer, sends it to main
window.addEventListener(
  "message",
  event => {
    if (event.origin === "file://" && event.source === window) {

      if (event.data.type === 'connected'){
        ipcRenderer.send('asynchronous-message', 'connected')
      }

      if (event.data.type === 'disconnected'){
        ipcRenderer.send('asynchronous-message', 'disconnected')
      }

      if (event.data.type === 'self-muted'){
        ipcRenderer.send('asynchronous-message', 'self-muted')
      }

      if (event.data.type === 'self-unmuted'){
        ipcRenderer.send('asynchronous-message', 'self-unmuted')
      }

      if (event.data.type === 'confirmMicOpen'){
        ipcRenderer.send('asynchronous-message', 'confirmMicOpen')
      }

      if (event.data.type === 'confirmMicClose'){
        ipcRenderer.send('asynchronous-message', 'confirmMicClose')
      }
    }
  },
  false
)