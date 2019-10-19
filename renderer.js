const { remote, ipcRenderer } = require('electron')

function removeBloat(webview) {
    webview.executeJavaScript(`document.getElementsByClassName("anchor-3Z-8Bb anchorUnderlineOnHover-2ESHQB")[0].remove();`) // Remove top-right help button
    webview.executeJavaScript(`document.getElementsByClassName("contents-18-Yxp button-3AYNKb button-2vd_v_")[0].remove();`) // Remove gift from chat
}

function muteMic(webview){
    console.log("not talking")
    webview.sendInputEvent({keyCode: 'Backspace', type: 'keyUp'});
    webview.sendInputEvent({keyCode: 'Backspace', type: 'char'});
    document.getElementById("title-bar-status").style.backgroundColor = "#212226"
    document.getElementById("title-bar-controls").style.backgroundColor = "#212226"
    document.getElementById("title-bar").style.backgroundColor = "#212226"
}

onload = () => {
    const webview = document.querySelector('webview')
    let muteTimeout = null

    ipcRenderer.send('asynchronous-message', 'DOMready')
    
    // Execute JS into the webview to detect when logging in is complete
    webview.addEventListener('did-finish-load', function() {
         webview.executeJavaScript(`
         let dlButton = document.getElementsByClassName("listItem-2P_4kh");
         t = setInterval(function(){
             if(dlButton.length != 0) {
                 console.log("discord-load-complete")
                 clearInterval(t)
             }else {
                 console.log("waiting for load")
             }
         }, 500);
         `)
    });


    webview.addEventListener('console-message', (e) => {
        if (e.message === "Constructed RTCPeerConnection") {
            console.log("Connected to server")
            ipcRenderer.send('asynchronous-message', 'connected')
        }

        if (e.message === "Close RTCPeerConnection") {
            console.log("Disconnected from server")
            ipcRenderer.send('asynchronous-message', 'disconnected')
        }

        if (e.message === "muted") {
            console.log("Self Muted in Discord")
            ipcRenderer.send('asynchronous-message', 'self-muted')
        }

        if (e.message === "unmuted") {
            console.log("Self Muted in Discord")
            ipcRenderer.send('asynchronous-message', 'self-unmuted')
        }

        if (e.message === "signalingState => stable, negotiation needed: false") {
            console.log("Mute/Unmute")
            removeBloat(webview)
            webview.executeJavaScript(`
            if (document.querySelectorAll('[aria-label="Mute"]').length === 0){
                console.log("muted")
            }else {
                console.log("unmuted")
            }
            `)
        }

        // To be finished
        if (e.message === "DOM changed") {
            removeBloat(webview)
        }

        // Execute JS into the webview after login
        if (e.message === "discord-load-complete") {
            webview.executeJavaScript(`document.getElementsByClassName("listItem-2P_4kh")[document.getElementsByClassName("listItem-2P_4kh").length - 1].remove();`) // Remove download button
            removeBloat(webview)
        }
    })

    ipcRenderer.on('micOpen', (event, msg) => {
        if (msg === 'mic-open'){
            clearTimeout(muteTimeout) // Cancel mic-off incase of accidental double-tap
            console.log("talking")
            webview.sendInputEvent({keyCode: 'Backspace', type: 'keyDown'});
            webview.sendInputEvent({keyCode: 'Backspace', type: 'char'});
            document.getElementById("title-bar-status").style.backgroundColor = "green"
            document.getElementById("title-bar-controls").style.backgroundColor = "green"
            document.getElementById("title-bar").style.backgroundColor = "green"
        }
    })

    ipcRenderer.on('micClose', (event, msg) => {
        if (msg === 'mic-closed'){
            muteTimeout = setTimeout(() => muteMic(webview), 1000); // 1 second threshold incase of accidental double-click or release so the user doesn't cut-out
        }
    })

    ipcRenderer.on('devMode', (event, msg) => {
        console.log(`Dev Mode: ${msg}`)
        if (msg === true) {
            webview.openDevTools()
        }
    })
}

document.getElementById('minimize-button').addEventListener('click', () => {
    remote.getCurrentWindow().minimize()
  })
  
document.getElementById('close-button').addEventListener('click', () => {
    remote.app.quit()
})