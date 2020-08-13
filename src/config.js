const {app} = require('electron')
const fs = require('file-system')
const path = require('path')

function _saveToConfig (configObj) {
    return new Promise(function (resolve, reject) {
        const documentsDir = app.getPath('documents')
        const configDir = path.join(documentsDir, 'Discord Sandbox')
        const configFile = path.join(configDir, 'config.json')
        console.log('\tUpdating config.json', configObj)
        fs.writeFile(configFile, JSON.stringify(configObj, null, 2), 'utf8', (err) => reject(err))
        return resolve(configObj)
    })
}

module.exports = {
    initConfig: function () {
        return new Promise((resolve, reject) => {
        const documentsDir = app.getPath('documents') // Fetchs user's documents directory
        const configDir = path.join(documentsDir, 'Discord Sandbox') // config is stored in user's home dir
        const configFile = path.join(configDir, 'config.json') // Saves all config information in config.json
        
        let configObj // Init configObj

        // If config.json does not exist, create it with blank values
        if (!fs.existsSync(configFile)) {
            console.log(`\tCreated ${configFile}`)
            configObj = {
            'pttDevice': 'mouse',
            'key': '4', 
            'delay': '1000', 
            }
            return resolve(_saveToConfig(configObj))
        }
        try {
            configObj = JSON.parse(fs.readFileSync(configFile, 'utf8'))
            return resolve(configObj)
        } catch (err) {
            return reject(err)
        }
        })
    },
    saveConfig: function(configObj) {
        return _saveToConfig(configObj)
    }
}