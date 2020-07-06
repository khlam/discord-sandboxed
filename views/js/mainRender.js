let blockedLibrary = {}
let isConnectedToVoiceServer = false

let keepAliveClientOP = null
let keepAliveRemoteOP = null

let windowName = 0

function convertObjToString(arr) {
    let arrStr = `[`
    arr.forEach(function(i, idx, array){
        let _subStr = i.toString()
        arrStr = arrStr.concat("'").concat(_subStr).concat("'")
        if (idx !== array.length - 1){ 
          arrStr = arrStr.concat(`,`)
        }
    })
    arrStr = arrStr.concat(`]`).toString()
    return arrStr
}

function openMic(webview){  
    console.log("talking")
    document.getElementById("overlay").style.display = "block";
    webview.sendInputEvent({keyCode: 'Backspace', type: 'keyDown'});
    //webview.sendInputEvent({keyCode: 'Backspace', type: 'char'});
}

function muteMic(webview){
    console.log("not talking")
    document.getElementById("overlay").style.display = "none";
    webview.sendInputEvent({keyCode: 'Backspace', type: 'keyUp'});
    //webview.sendInputEvent({keyCode: 'Backspace', type: 'char'});
}

function removeBloat(webview) {
    console.log("--Removing bloat")
    bloatList = [
        'noticeDefault',
        'noticeBrand',
        'actionButtons-14eAc_',
    ]
    bloatList.forEach(function(tag){
        webview.executeJavaScript(`
            document.querySelectorAll("div[class^=${tag}]").forEach(e => {
                console.log("Removing ", e)
                e.style.display = 'none'
            })
        `)
    })
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

    const whiteList = [
        'PATCH',                                       // Mute/Unmute/notification/cosmetic guild changes
        'DELETE',                                      // Leaving a guild / Deleting messages
        'https://discord.com/api/v6/channels/',        // Text channel address
        'https://discord.com/api/v6/auth/login',       // Login address
        'https://discord.com/api/v6/invites/',         // Accepting guild invite
        'https://discord.com/api/v6/voice/regions',    // Required when creating new guild
        'https://discord.com/api/v6/guilds',           // Creating a guild
    ]

    const _whiteList = convertObjToString(whiteList)

    // Insert JS to detect when discord finishes loading
    webview.addEventListener('did-finish-load', function() {
        
        // Discord does not do client-side hashing
        webview.executeJavaScript(`
        (function(open, send) {
            let whiteList = ${_whiteList}
            
            let xhrOpenRequestUrl
            let xhrSendResponseUrl
            let xhrMethod
            let responseData

            let _done = false
            let _block = true
            let _isWhitelisted = false

            XMLHttpRequest.prototype.open = function(method, url, async, x, y) {
                xhrMethod = method.toString()
                xhrOpenRequestUrl = url.toString()
                if (xhrOpenRequestUrl.includes("science")) {
                    console.log("--BLOCKED.OPEN|" + xhrOpenRequestUrl)
                    return open.apply(this, false)
                }

                console.log("EVALUATING:", xhrOpenRequestUrl)

                whiteList.forEach( wl => {
                    if (xhrOpenRequestUrl.includes(wl) || xhrMethod.includes(wl)) {
                        _done = true
                        _block = false
                        _isWhitelisted = true
                        console.log("--ALLOWED.OPEN", xhrOpenRequestUrl + "")
                        return open.apply(this, arguments)
                    }
                })

                if (_done === false) {
                    console.log("--BLOCKED.OPEN|" + xhrOpenRequestUrl)
                    return open.apply(this, false)
                }
            }
            
            XMLHttpRequest.prototype.send = function(data) {
                if (_block === true || _isWhitelisted === false) {
                    console.log("--BLOCKED.SEND", data, xhrOpenRequestUrl, _isWhitelisted)
                    return send.apply(this, false)
                }
                if (_block === false && _isWhitelisted === true) {
                    if (data && !data.toString().includes("password")) {
                        console.log("--ALLOWED.SEND", data, xhrOpenRequestUrl, _isWhitelisted)
                    }else {
                        console.log("--ALLOWED.SEND")
                    }
                    return send.apply(this, arguments)
                }
            }
        })(XMLHttpRequest.prototype.open, XMLHttpRequest.prototype.send)
        `)

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
    })

   // Send commands to preload.js
   webview.addEventListener('console-message', (e) => {
       
        if (e.message === "--user is connected to voice server") {
            console.log("Connected to server")
            window.postMessage({ type: "connected"}, "*")
            removeBloat(webview)
            isConnectedToVoiceServer = true
        }

        if (e.message === "--user is not connected to voice server") {
            console.log("Disconnected from server")
            window.postMessage({ type: "disconnected"}, "*")
            isConnectedToVoiceServer = false
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
            webview.executeJavaScript(`document.getElementsByClassName("listItem-2P_4kh")[document.getElementsByClassName("listItem-2P_4kh").length - 1].style.display = 'none';`) // Remove download button            
            userListChangeListener(webview)
            userMuteDeafenListener(webview)
            removeBloat(webview)
        }
        
        if (e.message.toString().includes("--BLOCKED.OPEN")) {
            let _url = e.message.toString().split(",").find(a =>a.includes("http")).split("https://")[1]
            if (!(_url in blockedLibrary)) {
                blockedLibrary[_url] = 1
            }

            blockedLibrary[_url] += 1

            window.postMessage({ type: "blockUpdate", payload: {url: _url, count: blockedLibrary[_url]}}, "*")
        }

        if (keepAliveClientOP === null) {
            if (e.message.toString().includes("S->>|")) {
                let _data = e.message.split("|")[1]
                _data = JSON.parse(_data)
                console.log(_data)
                if (Number.isInteger(_data.d)){
                    keepAliveClientOP = _data.op
                    console.log("Client OP", keepAliveClientOP)
                }
            }
        }

        if (keepAliveRemoteOP === null) {
            if (e.message.toString().includes("R-<<|")) {
                let _data = e.message.split("|")[1]
                _data = JSON.parse(_data)
                if (Number.isInteger(_data.d)){
                    keepAliveRemoteOP = _data.op
                    console.log("Client OP", keepAliveRemoteOP)
                }
            }
        }
    })

   // Accept commands from preload.js
    window.addEventListener(
        "message",
        event => {
          if (event.origin === "file://" && event.source === window) {
            if (event.data.type === "devMode" && event.data.text === "true") {
                console.log("Dev Mode On")
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

            if (event.data.type === 'URLCopied') {
                fadeBanner("copyConfirmBanner")
            }
          }
        },
        false
    )
}