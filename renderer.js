function removeBloat(webview) {
    console.log("removing bloat")
    webview.executeJavaScript(`document.getElementsByClassName("anchor-3Z-8Bb anchorUnderlineOnHover-2ESHQB")[0].remove();`) // Remove top-right help button
    webview.executeJavaScript(`document.getElementsByClassName("contents-18-Yxp button-3AYNKb button-2vd_v_")[0].remove();`) // Remove gift from chat
    webview.executeJavaScript(`document.getElementsByClassName("noticeDefault-362Ko2 notice-2FJMB4 size14-3iUx6q height36-36OHCc")[document.getElementsByClassName("noticeDefault-362Ko2 notice-2FJMB4 size14-3iUx6q height36-36OHCc").length - 1].remove();`) // Remove "get push to talk" top notification
    webview.executeJavaScript(`document.getElementsByClassName("channelNotice-1-XFjC invite-OjTXrW")[document.getElementsByClassName("channelNotice-1-XFjC invite-OjTXrW").length - 1].remove();`) // Remove "invite people" notification
}

function muteMic(webview){
    console.log("not talking")
    webview.sendInputEvent({keyCode: 'Backspace', type: 'keyUp'});
    webview.sendInputEvent({keyCode: 'Backspace', type: 'char'});
}

onload = () => {
    const webview = document.querySelector('webview')
    let muteTimeout = null

    // Insert JS to detect when discord finishes loading
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

   // Send commands to preload.js
   webview.addEventListener('console-message', (e) => {
        if (e.message === "Constructed RTCPeerConnection") {
            console.log("Connected to server")
            removeBloat(webview)
            window.postMessage({ type: "connected"}, "*")
        }

        if (e.message === "Close RTCPeerConnection") {
            console.log("Disconnected from server")
            window.postMessage({ type: "disconnected"}, "*")
        }

        if (e.message === "muted") {
            console.log("Self Muted in Discord")
            removeBloat(webview)
            window.postMessage({ type: "self-muted"}, "*")
        }

        if (e.message === "unmuted") {
            console.log("Self Un-Muted in Discord")
            removeBloat(webview)
            window.postMessage({ type: "self-unmuted"}, "*")
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

   // Accept commands from preload.js
    window.addEventListener(
        "message",
        event => {
          if (event.origin === "file://" && event.source === window) {

            if (event.data.type === "devMode" && event.data.text === "true") {
                webview.openDevTools()
            }

            if (event.data.type === 'micOpen'){
                clearTimeout(muteTimeout) // Cancel mic-off incase of accidental double-tap
                console.log("talking")
                webview.sendInputEvent({keyCode: 'Backspace', type: 'keyDown'});
                webview.sendInputEvent({keyCode: 'Backspace', type: 'char'});
            }

            if (event.data.type === 'micClose'){
                muteTimeout = setTimeout(() => muteMic(webview), 1000); // 1 second threshold incase of accidental double-click or release so the user doesn't cut-out
            }

          }
        },
        false
    )
}