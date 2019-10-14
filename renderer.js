const unMuteSound = new Audio('./assets/unmute.mp3')
const muteSound = new Audio('./assets/mute.mp3')

const { ipcRenderer } = require('electron')

onload = () => {
    const webview = document.querySelector('webview')
    webview.openDevTools()
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
}

ipcRenderer.on('ping', (event, message) => {
    if (message === 'mic-open'){
        console.log("mic is open")
        unMuteSound.play()
    }
    if (message === 'mic-closed'){
        console.log("mic is closed")
        muteSound.play()
    }
})


