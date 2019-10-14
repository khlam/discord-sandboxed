const unMuteSound = new Audio('./assets/unmute.mp3')
const muteSound = new Audio('./assets/mute.mp3')

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
