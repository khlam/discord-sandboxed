const { ipcRenderer } = require('electron')

// Pass commands sent from main.js to settingsRender
ipcRenderer.on('settingsObj', (event, msg) => {
  window.postMessage({ type: "settingsObj", payload: msg }, "*")
})

ipcRenderer.on('unfocused', (event, msg) => {
  window.postMessage({ type: "unfocused"}, "*")
})

ipcRenderer.on('focused', (event, msg) => {
  window.postMessage({ type: "focused"}, "*")
})

// Pass commands sent from settings window (processed by settingsRender.js) to main.js
window.addEventListener(
    "message",
    event => {
      if (event.origin === "file://" && event.source === window) {

        if (event.data.type === 'SettingsDOMReady'){
          ipcRenderer.send('asynchronous-message', {msg: 'SettingsDOMReady'})
        }
        if (event.data.type === 'setPTTKey'){
          ipcRenderer.send('asynchronous-message', {msg: 'setPTTKey'})
        }
        if (event.data.type === 'cancelSetPTTKey'){
          ipcRenderer.send('asynchronous-message', {msg: 'cancelSetPTTKey'})
        }
        if (event.data.type === 'setPTTDelay'){
          ipcRenderer.send('asynchronous-message', {msg: 'setPTTDelay', data: event.data.delay})
        }
        if (event.data.type === 'disablePTT'){
          ipcRenderer.send('asynchronous-message', {msg: 'disablePTT', data: event.data.pttEnable})
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
      }
    },
    false
)
