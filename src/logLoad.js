const { ipcRenderer } = require('electron')

// Pass commands sent from main.js to logRender.js
ipcRenderer.on('blockUpdate', (event, msg) => {
  window.postMessage({ type: "blockUpdate", payload: msg }, "*")
})

ipcRenderer.on('unfocused', (event, msg) => {
  window.postMessage({ type: "unfocused"}, "*")
})

ipcRenderer.on('focused', (event, msg) => {
  window.postMessage({ type: "focused"}, "*")
})

// Pass commands sent from log window (processed by logRender.js) to main.js
window.addEventListener(
    "message",
    event => {
      if (event.origin === "file://" && event.source === window) {
        if (event.data.type === 'minimizeApplication'){
          ipcRenderer.send('asynchronous-message', {msg: 'minimizeApplication', data: event.data.payload})
        }
  
        if (event.data.type === 'maximizeApplication'){
          ipcRenderer.send('asynchronous-message', {msg: 'maximizeApplication', data: event.data.payload})
        }
  
        if (event.data.type === 'closeApplication'){
          ipcRenderer.send('asynchronous-message', {msg: 'closeApplication', data: event.data.payload})
        }
      }
    },
    false
  )
