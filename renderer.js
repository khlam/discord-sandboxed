const { ipcRenderer } = require('electron')

onload = () => {
    const webview = document.querySelector('webview')

    ipcRenderer.send('asynchronous-message', 'DOMready')

    webview.addEventListener('console-message', (e) => {
        if (e.message === "Constructed RTCPeerConnection") {
            console.log("Connected to server")
            ipcRenderer.send('asynchronous-message', 'connected')
        }

        if (e.message === "Close RTCPeerConnection") {
            console.log("Disconnected from server")
            ipcRenderer.send('asynchronous-message', 'disconnected')
        }
    })

    ipcRenderer.on('ping', (event, msg) => {
        if (msg === 'mic-open'){
            console.log("talking")
            webview.sendInputEvent({keyCode: 'Backspace', type: 'keyDown'});
            webview.sendInputEvent({keyCode: 'Backspace', type: 'char'});
        }
        if (msg === 'mic-closed'){
            console.log("not talking")
            webview.sendInputEvent({keyCode: 'Backspace', type: 'keyUp'});
            webview.sendInputEvent({keyCode: 'Backspace', type: 'char'});
        }
    })

    ipcRenderer.on('devMode', (event, msg) => {
        console.log(`Dev Mode: ${msg}`)
        if (msg === true) {
            webview.openDevTools()
        }
    })
}