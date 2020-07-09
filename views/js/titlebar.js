// Send window minimize/maximize/close commands to main
// See windowName variable in mainRender.js, logRender.js, and settingsRender.js
const minButton = document.getElementById('minimize-button')
if (minButton) {
    minButton.onclick = function () {
        window.postMessage({ type: "minimizeApplication", payload: {wName: windowName}}, "*")
    }
}

const minMaxButton = document.getElementById('min-max-button')
if (minMaxButton) {
    minMaxButton.onclick = function () {
        window.postMessage({ type: "maximizeApplication", payload: {wName: windowName}}, "*")
    }
}

const closeButton = document.getElementById('close-button')
if (closeButton) {
    closeButton.onclick = function () {
        window.postMessage({ type: "closeApplication", payload: {wName: windowName}}, "*")
    }
}

const logButton = document.getElementById('openLogButton')
if (logButton) {
    logButton.onclick = function () {
        window.postMessage({ type: "openLog" }, "*")
    }
}

const settingsButton = document.getElementById('openSettingsButton')
if (settingsButton) {
    settingsButton.onclick = function () {
        window.postMessage({ type: "openSettings" }, "*")
    }
}