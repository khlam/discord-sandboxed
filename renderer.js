function openMic(webview){  
    console.log("talking")
    document.getElementById("overlay").style.display = "block";
    webview.sendInputEvent({keyCode: 'Backspace', type: 'keyDown'});
    webview.sendInputEvent({keyCode: 'Backspace', type: 'char'});
}

function muteMic(webview){
    console.log("not talking")
    document.getElementById("overlay").style.display = "none";
    webview.sendInputEvent({keyCode: 'Backspace', type: 'keyUp'});
    webview.sendInputEvent({keyCode: 'Backspace', type: 'char'});
}

// Creates an observer for user list to detect if server is switched
function userListChangeListener(webview) {
    webview.executeJavaScript(`
    const userList = document.getElementsByClassName("sidebar-2K8pFh")[0]
    const userListconfig = { attributes: false, childList: true, subtree: true, characterData: false };
    
    const userListChangeCallback = function(mutationsList, observer) {
        console.log('--user list changed');

        if (document.querySelectorAll('[aria-label="Disconnect"]').length === 1){
            console.log('--user is connected to voice server')
        }else {
            console.log('--user is not connected to voice server')
        }

    };
    const userListObserver = new MutationObserver(userListChangeCallback);
    userListObserver.observe(userList, userListconfig);
    `)
}

function userMuteDeafenListener(webview) {
    webview.executeJavaScript(`
    const userMuteDeafen = document.getElementsByClassName("container-3baos1")[0]
    const userMuteDeafenconfig = { attributes: false, childList: true, subtree: true, characterData: false };
    
    const userMuteDeafencallback = function(mutationsList, observer) {
        isMicMuted()
    };
    const userMuteDeafenObserver = new MutationObserver(userMuteDeafencallback);
    userMuteDeafenObserver.observe(userMuteDeafen, userMuteDeafenconfig);
    `)
}

onload = () => {
    document.getElementById("overlay").style.display = "none";
    const webview = document.querySelector('webview')
    let muteTimeout = null

    // Insert JS to detect when discord finishes loading
    webview.addEventListener('did-finish-load', function() {
        webview.executeJavaScript(`
        let dlButton = document.getElementsByClassName("listItem-2P_4kh");
        t = setInterval(function(){
            if(dlButton.length != 0) {
                console.log("--discord-load-complete")
                clearInterval(t)
                isMicMuted()
            }else {
                console.log("waiting for load")
            }
        }, 500);
        `)
    
    // Insert a function that will be called later
    webview.executeJavaScript(`
        function isMicMuted() {
            if (document.querySelectorAll('[aria-label="Mute"]')[0].getAttribute("aria-checked") === "false"){
                console.log("unmuted")
            }else {
                console.log("muted")
            }
        }
        `)
    });

   // Send commands to preload.js
   webview.addEventListener('console-message', (e) => {
        if (e.message === "--user is connected to voice server") {
            console.log("Connected to server")
            window.postMessage({ type: "connected"}, "*")
        }

        if (e.message === "--user is not connected to voice server") {
            console.log("Disconnected from server")
            window.postMessage({ type: "disconnected"}, "*")
        }

        if (e.message === "muted") {
            console.log("Self Muted in Discord")
            window.postMessage({ type: "self-muted"}, "*")
        }

        if (e.message === "unmuted") {
            console.log("Self Un-Muted in Discord")
            window.postMessage({ type: "self-unmuted"}, "*")
        }

        // Execute JS into the webview after login
        if (e.message === "--discord-load-complete") {
            webview.executeJavaScript(`document.getElementsByClassName("listItem-2P_4kh")[document.getElementsByClassName("listItem-2P_4kh").length - 1].remove();`) // Remove download button            
            userListChangeListener(webview)
            userMuteDeafenListener(webview)
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
                openMic(webview)
                window.postMessage({ type: "confirmMicOpen"}, "*")
            }

            if (event.data.type === 'micClose'){
                muteMic(webview)
                window.postMessage({ type: "confirmMicClose"}, "*")
            }

          }
        },
        false
    )
}