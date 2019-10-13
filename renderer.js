require('electron').ipcRenderer.on('ping', (event, message) => {
    if (message === 'mic-open'){
        console.log("mic is open")
        let unmute = document.getElementById("unmute");
        unmute.volume=0.3
        unmute.play();
    }
    if (message === 'mic-closed'){
        console.log("mic is closed")
        let mute = document.getElementById("mute");
        mute.volume=0.3
        mute.play();
    }
})
