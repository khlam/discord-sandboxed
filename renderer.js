const customTitlebar = require('custom-electron-titlebar');
 
t = new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#444')
});

require('electron').ipcRenderer.on('ping', (event, message) => {
    if (message === 'mic-open'){
        console.log("mic is open")
        playSound()
    }
    if (message === 'mic-closed'){
        console.log("mic is closed")
        playSound()
    }
})

function playSound() {
    var sound = document.getElementById("audio");
    sound.volume=0.3
    sound.play();
}