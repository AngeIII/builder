import React from 'react'
import classNames from 'classnames'
import NavbarContent from '../navbarContent'

import {getStorage} from 'vc-cake'

const localStorage = getStorage('localStorage')

export default class SaveControl extends NavbarContent {
  state = {
    saving: false,
    saved: false
  }

  clickSaveData = () => {
    this.setState({ 'saving': true })
    setTimeout(() => {
      this.setState({ 'saving': false })
      this.setState({ 'saved': true })
      setTimeout(() => {
        this.setState({ 'saved': false })
      }, 1000)
    }, 500)
    localStorage.trigger('save')
    // this.props.api.request('node:save')
  }

  render () {
    let saveButtonClasses = classNames({
      'vcv-ui-navbar-control': true,
      'vcv-ui-state--success': this.state.saved
    })
    let saveIconClasses = classNames({
      'vcv-ui-navbar-control-icon': true,
      'vcv-ui-wp-spinner-light': this.state.saving,
      'vcv-ui-icon': !this.state.saving,
      'vcv-ui-icon-save': !this.state.saving
    })

    return (
      <div className='vcv-ui-navbar-controls-group vcv-ui-pull-end'>
        <span className={saveButtonClasses} title='Save' onClick={this.clickSaveData}>
          <span className='vcv-ui-navbar-control-content'>
            <i className={saveIconClasses} />
            <span>Save</span>
          </span>
        </span>
      </div>
    )
  }
}
