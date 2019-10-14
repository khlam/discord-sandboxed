const unMuteSound = new Audio('./assets/unmute.mp3')
const muteSound = new Audio('./assets/mute.mp3')
const ipc = require('electron').ipcRenderer;

onload = () => {
    const webview = document.querySelector('webview')
    webview.openDevTools()
    webview.addEventListener('console-message', (e) => {
        console.log('D: ', e.message)

        if (e.message === "Close RTCPeerConnection") {
            console.log("Disconnected from server")
        }
    })
}

require('electron').ipcRenderer.on('ping', (event, message) => {
    if (message === 'mic-open'){
        console.log("mic is open")
        unMuteSound.play()
    }
    if (message === 'mic-closed'){
        console.log("mic is closed")
        muteSound.play()
    }
})


