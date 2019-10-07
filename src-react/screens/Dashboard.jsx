import React from 'react'
import { ButtonInput } from '../components/ButtonInput'
const { app } = window.require('electron').remote

class Dashboard extends React.Component {
  render () {
    return (
      <div>
        <ButtonInput />
        <p>
          Version: {app.getVersion()}
        </p>
      </div>
    )
  }
}

module.exports = Dashboard
