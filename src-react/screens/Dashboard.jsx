import React from 'react'
import { ButtonInput } from '../components/ButtonInput'
const { app } = window.require('electron').remote

class Dashboard extends React.Component {
  render () {
    return (
      <div>
          <webview src="https://discordapp.com/login"></webview>
      </div>
    )
  }
}

module.exports = Dashboard
