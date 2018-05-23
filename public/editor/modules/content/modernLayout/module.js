/* global VCV_PLUGIN_UPDATE */
import vcCake from 'vc-cake'
import React from 'react'
import ReactDOM from 'react-dom'
import Editor from './lib/editor'
import DndManager from './lib/dndManager'
import ControlsManager from './lib/controlsIframe/controlsManager'
import MobileControlsManager from './lib/controlsIframe/mobileControlsManager'
import Notifications from './lib/notifications'
import MobileDetect from 'mobile-detect'
import OopsScreen from 'public/resources/components/oopsScreen/component'

const Utils = vcCake.getService('utils')
const workspaceStorage = vcCake.getStorage('workspace')
const workspaceNotifications = workspaceStorage.state('notifications')
const workspaceSettings = workspaceStorage.state('settings')
const workspaceIFrame = workspaceStorage.state('iframe')
const elementsStorage = vcCake.getStorage('elements')
const assetsStorage = vcCake.getStorage('assets')

vcCake.add('contentModernLayout', (api) => {
  let iframeContent = document.getElementById('vcv-layout-iframe-content')
  let dnd = new DndManager(api)
  let controls = new ControlsManager(api)
  let notifications = new Notifications(document.querySelector('.vcv-layout-overlay'), 10)
  const localizations = window.VCV_I18N && window.VCV_I18N()
  if (Utils.isRTL()) {
    document.body && document.body.classList.add('rtl')
  }

  const renderLayout = (reload = false) => {
    /* 'REFACTOR_ELEMENT_ACCESS_POINT' uncomment to enable public ElementAPI in browser console */
    // let elementAccessPoint = vcCake.env('REFACTOR_ELEMENT_ACCESS_POINT') ? vcCake.getService('elementAccessPoint') : null
    // elementAccessPoint && (window.elAP = elementAccessPoint)
    /* */
    workspaceIFrame.ignoreChange(reloadLayout)
    workspaceIFrame.set(false)
    let iframe = document.getElementById('vcv-editor-iframe')
    let iframeWindow = iframe ? iframe.contentWindow : null
    let domContainer = iframeWindow ? iframeWindow.document.getElementById('vcv-editor') : null
    if (domContainer) {
      ReactDOM.render(
        <Editor api={api} />,
        domContainer
      )

      !reload && dnd.init()
      !reload && notifications.init()

      workspaceIFrame.onChange(reloadLayout)
      if (vcCake.env('TF_SHOW_PLUGIN_UPDATE')) {
        const pluginUpdate = VCV_PLUGIN_UPDATE()
        pluginUpdate && workspaceNotifications.set({
          position: 'top',
          transparent: false,
          showCloseButton: true,
          rounded: false,
          type: 'warning',
          text: localizations.newPluginVersionIsAvailable || `There is a new version of Visual Composer Website Builder available`,
          html: true,
          cookie: {
            name: 'vcv-update-notice',
            expireInDays: 1
          },
          time: 10000
        })
      }

      const mobileDetect = new MobileDetect(window.navigator.userAgent)
      if (mobileDetect.mobile() && (mobileDetect.tablet() || mobileDetect.phone())) {
        let mobileControls = new MobileControlsManager(api)
        mobileControls.init()

        workspaceNotifications.set({
          position: 'bottom',
          transparent: true,
          rounded: true,
          text: localizations.mobileTooltipText || 'Double tap on an element to open the edit window. Tap and hold to initiate drag and drop in a Tree view.',
          cookie: 'vcv-mobile-tooltip',
          time: 10000
        })
        return
      }

      reload ? controls.updateIframeVariables() : controls.init()
      if (vcCake.env('THEME_LAYOUTS')) {
        iframeWindow.document.querySelectorAll('[data-vcv-layout-zone]').forEach((zone) => {
          let zoneButton = zone.querySelector('[data-vcv-action="settings"]')
          zoneButton && zoneButton.addEventListener('click', () => {
            workspaceStorage.state('content').set('settings')
            if (vcCake.env('HUB_REDESIGN')) {
              workspaceSettings.set({ action: 'settings' })
            }
          })
        })
      }
    } else {
      // alert('failed to render')
      document.body.innerHTML = `<div id='vcv-oops-screen-container'></div>`
      let oopsContainer = document.getElementById('vcv-oops-screen-container')
      if (oopsContainer) {
        ReactDOM.render(
          <OopsScreen error={window.vcvFeError || 'default'} />,
          oopsContainer
        )
      }
    }
  }

  const createLoadingScreen = () => {
    ReactDOM.unmountComponentAtNode(iframeContent)
    iframeContent.innerHTML = `<div class='vcv-loading-overlay'>
        <div class='vcv-loading-overlay-inner'>
          <div class='vcv-loading-dots-container'>
            <div class='vcv-loading-dot vcv-loading-dot-1'></div>
            <div class='vcv-loading-dot vcv-loading-dot-2'></div>
          </div>
        </div>
      </div>`
  }

  const reloadLayout = ({ type, template, header, sidebar, footer }) => {
    if (type === 'reload') {
      createLoadingScreen()
      let iframe = window.document.getElementById('vcv-editor-iframe')
      let domContainer = iframe.contentDocument.getElementById('vcv-editor')
      if (domContainer) {
        ReactDOM.unmountComponentAtNode(domContainer)
      }
      let data = vcCake.getService('document').all()
      iframe.onload = () => {
        let visibleElements = vcCake.getService('utils').getVisibleElements(data)
        workspaceIFrame.set({ type: 'loaded' })
        elementsStorage.trigger('updateAll', data)
        assetsStorage.trigger('updateAllElements', visibleElements)
        const settingsStorage = vcCake.getStorage('settings')
        const customCssState = settingsStorage.state('customCss')
        const globalCssState = settingsStorage.state('globalCss')
        const localJsState = settingsStorage.state('localJs')
        const globalJsState = settingsStorage.state('globalJs')
        if (customCssState.get()) {
          customCssState.set(customCssState.get())
        }
        if (globalCssState.get()) {
          globalCssState.set(globalCssState.get())
        }
        if (localJsState.get()) {
          localJsState.set(localJsState.get())
        }
        if (globalJsState.get()) {
          globalJsState.set(globalJsState.get())
        }
      }
      let url = iframe.src.split('?')
      let params = url[ 1 ].split('&')
      params = params.reduce((arr, item) => {
        let write = true
        if (item.indexOf('vcv-template') >= 0) {
          write = false
        }
        if (item.indexOf('vcv-nonce') >= 0) {
          write = false
        }
        if (vcCake.env('THEME_LAYOUTS')) {
          if (
            item.indexOf('vcv-header') >= 0 ||
            item.indexOf('vcv-sidebar') >= 0 ||
            item.indexOf('vcv-footer') >= 0
          ) {
            write = false
          }
        }
        write && arr.push(item)
        return arr
      }, [])
      params.push(`vcv-nonce=${window.vcvNonce}`)
      if (template) {
        params.push(`vcv-template=${template.value}`)
        params.push(`vcv-template-type=${template.type}`)

        let hasHeader = false
        let hasSidebar = false
        let hasFooter = false
        let currentLayoutType = window.VCV_PAGE_TEMPLATES_LAYOUTS && window.VCV_PAGE_TEMPLATES_LAYOUTS() && window.VCV_PAGE_TEMPLATES_LAYOUTS().find(item => item.type === template.type)
        if (currentLayoutType && currentLayoutType.values) {
          let currentTemplate = currentLayoutType.values.find(item => item.value === template.value)
          if (currentTemplate) {
            hasHeader = currentTemplate.header
            hasSidebar = currentTemplate.sidebar
            hasFooter = currentTemplate.footer
          }
        }
        if (vcCake.env('THEME_LAYOUTS')) {
          if (hasHeader && header) {
            params.push(`vcv-header=${header}`)
          }
          if (hasSidebar && sidebar) {
            params.push(`vcv-sidebar=${sidebar}`)
          }
          if (hasFooter && footer) {
            params.push(`vcv-footer=${footer}`)
          }
        }
      }
      url[ 1 ] = params.join('&')
      iframe.src = url.join('?')
    } else if (type === 'loaded') {
      renderLayout(true)
    }
  }

  renderLayout()
})
