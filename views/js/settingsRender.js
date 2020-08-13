let windowName = 2

let configObj = null

let isSettingPTTKey = false

onload = () => {
    window.postMessage({ type: "SettingsDOMReady"}, "*")
    console.log("sent dom ready")
}

const setPTTEnable = document.getElementById('pttEnable')
if (setPTTEnable) {
    setPTTEnable.onclick = function () {
        console.log(`Set PTT Enabled: ${setPTTEnable.checked}`)
        window.postMessage({ type: "disablePTT" , pttEnable: setPTTEnable.checked}, "*")
        if (setPTTEnable.checked) {
            setPTTKey.style.display = "block"
            setPTTDelay.type = "number"
        }else {
            setPTTKey.style.display = "none"
            setPTTDelay.type = "hidden"
        }
    }
}

const setPTTKey = document.getElementById('setPTTKeyButton')
if (setPTTKey) {
    setPTTKey.onclick = function () {
        if (isSettingPTTKey === false) {
            isSettingPTTKey = true
            console.log("Rebind PTT key clicked")
            window.postMessage({ type: "setPTTKey"}, "*")
            document.getElementById("setPTTKeyButton").innerText = "Press any key... Click here to cancel"
        }else {
            window.postMessage({ type: "cancelSetPTTKey"}, "*")
        }
    }
}

const setPTTDelay = document.getElementById('pttDelay')
if (setPTTDelay) {
    setPTTDelay.onchange = function () {
        console.log(setPTTDelay.value)
        window.postMessage({ type: "setPTTDelay" , delay: setPTTDelay.value}, "*")
    }
}

function displayCurrentSettings() {
    if (configObj.pttDevice && configObj.key) {
        setPTTEnable.checked = true
        setPTTKey.innerText = `${configObj.pttDevice} button ${configObj.key}`
        setPTTDelay.value = configObj.delay
        setPTTKey.style.display = "block"
        setPTTDelay.type = "number"
    }else {
        setPTTEnable.checked = false
        setPTTKey.style.display = "none"
        setPTTDelay.type = "hidden"
    }
}

// Accept commands from settingsLoad.js
window.addEventListener(
    "message",
    event => {
        if (event.origin === "file://" && event.source === window) {
            if (event.data.type === 'settingsObj') {
                isSettingPTTKey = false
                configObj = event.data.payload
                console.log(configObj)
                displayCurrentSettings()
            }
            
            if (event.data.type === 'unfocused'){
                console.log("window unfocused")
                document.getElementById('titleBar').style.color = "#7f7f7f"
            }
            if (event.data.type === 'focused'){
                console.log("window focused")
                document.getElementById('titleBar').style.color = "#ffffff"
            }
        }
    },
    false
)