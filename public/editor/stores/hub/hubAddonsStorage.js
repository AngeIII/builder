import { addStorage, getService, getStorage } from 'vc-cake'
import $ from 'jquery'

addStorage('hubAddons', (storage) => {
  const workspaceStorage = getStorage('workspace')
  const workspaceNotifications = workspaceStorage.state('notifications')
  const hubAddonsService = getService('hubAddons')
  const utils = getService('utils')

  storage.on('start', () => {
    storage.state('addonsTeasers').set(window.VCV_HUB_GET_ADDON_TEASER ? window.VCV_HUB_GET_ADDON_TEASER() : {})
    storage.state('addons').set(window.VCV_HUB_GET_ADDONS ? window.VCV_HUB_GET_ADDONS() : {})
  })

  storage.on('add', (addonsData, addBundle) => {
    let addons = storage.state('addons').get() || {}
    addons[ addonsData.tag ] = addonsData
    hubAddonsService.add(addonsData)
    storage.state('addons').set(Object.assign({}, addons))
    if (addBundle && addonsData && addonsData.bundlePath) {
      Promise.all([ $.getScript(addonsData.bundlePath) ])
    }
  })

  storage.on('downloadAddon', (addon) => {
    const localizations = window.VCV_I18N ? window.VCV_I18N() : {}
    const { tag, name } = addon
    let bundle = 'addon/' + tag.charAt(0).toLowerCase() + tag.substr(1, tag.length - 1)
    let downloadedAddons = storage.state('addons').get()
    if (addon.bundle) {
      bundle = addon.bundle
    }
    let data = {
      'vcv-action': 'hub:download:addon:adminNonce',
      'vcv-bundle': bundle,
      'vcv-nonce': window.vcvNonce
    }
    let successMessage = localizations.successAddonDownload || '{name} has been successfully downloaded from the Visual Composer Hub and added to your library'
    if (downloadedAddons[tag]) {
      return
    }

    let downloadingItems = workspaceStorage.state('downloadingItems').get() || []
    if (downloadingItems.includes(tag)) {
      return
    }
    downloadingItems.push(tag)
    workspaceStorage.state('downloadingItems').set(downloadingItems)
    let tries = 0
    const tryDownload = () => {
      let successCallback = (response) => {
        try {
          let jsonResponse = window.JSON.parse(response)
          if (jsonResponse && jsonResponse.status) {
            workspaceNotifications.set({
              position: 'bottom',
              transparent: true,
              rounded: true,
              text: successMessage.replace('{name}', name),
              time: 3000
            })
            utils.buildVariables(jsonResponse.variables || [])
            // Initialize addon depended elements
            if (jsonResponse.elements && Array.isArray(jsonResponse.elements)) {
              jsonResponse.elements.forEach((element) => {
                element.tag = element.tag.replace('element/', '')
                getStorage('hubElements').trigger('add', element, true)
              })
            }
            if (jsonResponse.addons && Array.isArray(jsonResponse.addons)) {
              jsonResponse.addons.forEach((addon) => {
                addon.tag = addon.tag.replace('addon/', '')
                storage.trigger('add', addon, true)
              })
            }
            workspaceStorage.trigger('removeFromDownloading', tag)
          } else {
            tries++
            console.warn('failed to download addon status is false', jsonResponse, response)
            if (tries < 2) {
              tryDownload()
            } else {
              let errorMessage = localizations.licenseErrorAddonDownload || 'Failed to download addon (license expired or request timed out)'
              if (jsonResponse && jsonResponse.message) {
                errorMessage = jsonResponse.message
              }

              console.warn('failed to download addon status is false', errorMessage, response)
              workspaceNotifications.set({
                type: 'error',
                text: errorMessage,
                showCloseButton: 'true',
                icon: 'vcv-ui-icon vcv-ui-icon-error',
                time: 5000
              })
              workspaceStorage.trigger('removeFromDownloading', tag)
            }
          }
        } catch (e) {
          tries++
          console.warn('failed to parse download response', e, response)
          if (tries < 2) {
            tryDownload()
          } else {
            workspaceNotifications.set({
              type: 'error',
              text: localizations.defaultErrorAddonDownload || 'Failed to download addon',
              showCloseButton: 'true',
              icon: 'vcv-ui-icon vcv-ui-icon-error',
              time: 5000
            })
            workspaceStorage.trigger('removeFromDownloading', tag)
          }
        }
      }
      let errorCallback = (response) => {
        workspaceStorage.trigger('removeFromDownloading', tag)
        tries++
        console.warn('failed to download addon general server error', response)
        if (tries < 2) {
          tryDownload()
        } else {
          workspaceNotifications.set({
            type: 'error',
            text: localizations.defaultErrorAddonDownload || 'Failed to download addon',
            showCloseButton: 'true',
            icon: 'vcv-ui-icon vcv-ui-icon-error',
            time: 5000
          })
        }
      }
      utils.startDownload(tag, data, successCallback, errorCallback)
    }
    tryDownload()
  })
})
