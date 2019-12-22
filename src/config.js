const {app} = require('electron')
const fs = require('file-system')
const path = require('path')

module.exports = {
    initConfig: function () {
        return new Promise((resolve, reject) => {
        const documentsDir = app.getPath('documents') // Fetchs user's documents directory
        const configDir = path.join(documentsDir, 'Discord Sandbox') // config is stored in user's home dir
        const UIConfig = path.join(configDir, 'config.json') // Saves all config information in config.json
        
        let configObj // Init configObj

        // If config.json does not exist, create it with blank values
        if (!fs.existsSync(UIConfig)) {
            console.log(`\tCreated ${UIConfig}`)
            configObj = {
            'key': '4', 
            'delay': '1000', 
            }
            return resolve(saveToConfig(UIConfig, configObj))
        }
        try {
            configObj = JSON.parse(fs.readFileSync(UIConfig, 'utf8'))
            return resolve(configObj)
        } catch (err) {
            return reject(err)
        }
        })
    }
}

function saveToConfig (configPath, configObj) {
    return new Promise(function (resolve, reject) {
        console.log('\tUpdating config.json')
        fs.writeFile(configPath, JSON.stringify(configObj, null, 2), 'utf8', (err) => reject(err))
        return resolve(configObj)
    })
}