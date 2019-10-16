const { remote, ipcRenderer } = require('electron')

onload = () => {
    const webview = document.querySelector('webview')

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
         }, 1500);
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

        // Execute JS into the webview after login to remove the download button at the bottom of the server list.
        if (e.message === "discord-load-complete") {
            webview.executeJavaScript(`
                let a = document.getElementsByClassName("listItem-2P_4kh");
                a[a.length-1].innerHTML = "";
            `)
        }
    })

    ipcRenderer.on('ping', (event, msg) => {
        if (msg === 'mic-open'){
            console.log("talking")
            webview.sendInputEvent({keyCode: 'Backspace', type: 'keyDown'});
            webview.sendInputEvent({keyCode: 'Backspace', type: 'char'});
            document.getElementById("title-bar-status").style.backgroundColor = "green"
            document.getElementById("title-bar-controls").style.backgroundColor = "green"
            document.getElementById("title-bar").style.backgroundColor = "green"

        }
        if (msg === 'mic-closed'){
            console.log("not talking")
            webview.sendInputEvent({keyCode: 'Backspace', type: 'keyUp'});
            webview.sendInputEvent({keyCode: 'Backspace', type: 'char'});
            document.getElementById("title-bar-status").style.backgroundColor = "#23272A"
            document.getElementById("title-bar-controls").style.backgroundColor = "#23272A"
            document.getElementById("title-bar").style.backgroundColor = "#23272A"

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