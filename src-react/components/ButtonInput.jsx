import React, { Component } from 'react'
import { ipcRenderer } from 'electron'

function getNewInput (newInput) {
  return newInput
}

export class ButtonInput extends Component {
  constructor (props) {
    super(props)

    this.state = {
      input: '',
      inputObj: {}
    }
  }

  onReceive() {
    ipcRenderer.on('newInputObj', this.doConsolePrint.bind(this))
  }

  doConsolePrint(e, newInputObj) {
    console.log("here")
    let { inputObj } = this.state
    console.log(newInputObj)
    inputObj = newInputObj
    this.setState({ inputObj })
  }

  onChange (e) {
    this.setState({ input: e.target.value })
  }

  onGet (e) {
    const { input } = this.state
    if (getNewInput(input)) {
      ipcRenderer.send('newInput', input)
    }
  }
  render () {
    return (
      <div>
        <input value={this.state.input} onChange={this.onChange.bind(this)} type='text' />
        <button onClick={this.onGet.bind(this)}>Send</button>
      </div>
    )
  }
}
