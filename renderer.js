function removeBloat(webview) {
    console.log("Removing bloat")
    bloatList = [
        'buttons-205you', // remove buttons from chat box (Gift, GIF, and Emojis)
        'noticeDefault-362Ko2',
        'channelNotice-1-XFjC',
    ]
    bloatList.forEach(function(tag){
        webview.executeJavaScript(`
        if (document.getElementsByClassName("${tag}").length !== 0){
            document.getElementsByClassName("${tag}")[document.getElementsByClassName("${tag}").length - 1].remove();
        }
        `)
      })
}

function muteMic(webview){
    console.log("not talking")
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

        if (document.getElementsByClassName("container-1giJp5").length !== 0){
            console.log('--user has connected to discord voice server')
        }else {
            console.log('--user has disconnected to discord voice server')
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
            if (document.querySelectorAll('[aria-label="Mute"]').length === 0){
                console.log("muted")
            }else {
                console.log("unmuted")
            }
        }
        `)
    });

   // Send commands to preload.js
   webview.addEventListener('console-message', (e) => {
        if (e.message === "--user has connected to discord voice server") {
            console.log("Connected to server")
            removeBloat(webview)
            window.postMessage({ type: "connected"}, "*")
        }

        if (e.message === "--user has disconnected to discord voice server") {
            console.log("Disconnected from server")
            window.postMessage({ type: "disconnected"}, "*")
        }

        if (e.message === '--user list changed') {
            //removeBloat(webview)
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
            //removeBloat(webview)
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
                clearTimeout(muteTimeout) // Cancel mic-off incase of accidental double-tap
                console.log("talking")
                webview.sendInputEvent({keyCode: 'Backspace', type: 'keyDown'});
                webview.sendInputEvent({keyCode: 'Backspace', type: 'char'});
            }

            if (event.data.type === 'micClose'){
                muteTimeout = setTimeout(() => muteMic(webview), 1200); // incase accidental double-click or release so the user doesn't cut-out
            }

          }
        },
        false
    )
}