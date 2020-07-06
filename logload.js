const { ipcRenderer } = require('electron')

// Send commands from main to logRenderer
ipcRenderer.on('blockUpdate', (event, msg) => {
    window.postMessage({ type: "blockUpdate", payload: msg }, "*")
})


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
