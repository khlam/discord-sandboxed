let robot = require("kbm-robot");
robot.startJar();

require('electron').ipcRenderer.on('ping', (event, message) => {
    if (message === 'mic-open'){
        console.log("mic is open")
        robot.press("n").go()
    }
    if (message === 'mic-closed'){
        console.log("mic is closed")
        robot.release("n").go()
    }
})

document.addEventListener('keydown', function (e) {
    console.log('Key: ' + e.key + ' pressed');
});