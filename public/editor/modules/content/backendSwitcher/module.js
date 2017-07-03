import vcCake from 'vc-cake'
import ReactDOM from 'react-dom'
import React from 'react'

import BackendSwitcher from './lib/helpers/backendSwitcher/component'
import BackendClassicSwitcher from './lib/helpers/backendSwitcher/backendClassicSwitcher'

vcCake.add('backendSwitcher', (api) => {
  let titleDiv = document.querySelector('div#titlediv')
  let switcherContainer = document.createElement('div')
  switcherContainer.className = 'vcv-wpbackend-switcher-container'
  let render = false
  if (titleDiv) {
    titleDiv.parentNode.insertBefore(switcherContainer, titleDiv.nextSibling)
    render = true
  } else {
    let postBodyContent = document.getElementById('post-body-content')
    if (postBodyContent) {
      if (postBodyContent.firstChild) {
        postBodyContent.insertBefore(switcherContainer, postBodyContent.firstChild)
      } else {
        postBodyContent.appendChild(switcherContainer)
      }
      render = true
    }
  }

  if (render && vcCake.env('FEATURE_CLASSIC_EDITOR_CONTROL')) {
    ReactDOM.render(
      <BackendClassicSwitcher />,
      switcherContainer
    )
  } else if (render) {
    ReactDOM.render(
      <BackendSwitcher />,
      switcherContainer
    )
  }
})
