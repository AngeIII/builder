import { addStorage, getService, getStorage, env } from 'vc-cake'

addStorage('hubTemplates', (storage) => {
  const workspaceStorage = getStorage('workspace')
  const workspaceNotifications = workspaceStorage.state('notifications')
  const utils = getService('utils')

  storage.on('start', () => {
    /**
     * @deprecated 2.5 on remove need to set state(templates) {}
     */
    if (!env('FT_TEMPLATE_LOAD_ASYNC')) {
      let vcvtemplates = storage.state('templates').get() || window.VCV_TEMPLATES()
      if (!vcvtemplates || Array.isArray(vcvtemplates)) {
        vcvtemplates = {}
      }
      storage.state('templates').set(vcvtemplates)
    } else {
      // TODO: Remove this code with whole on('start') block and refactor initial templates loading
      storage.state('templates').set(storage.state('templates').get() || {})
    }
  })

  storage.on('downloadTemplate', (template) => {
    const { bundle, name } = template
    const localizations = window.VCV_I18N && window.VCV_I18N()
    let data = {
      'vcv-action': 'hub:download:template:adminNonce',
      'vcv-bundle': bundle,
      'vcv-nonce': window.vcvNonce
    }
    let tag = bundle.replace('template/', '').replace('predefinedTemplate/', '')
    let successMessage = localizations.successTemplateDownload || '{name} has been successfully downloaded from the Visual Composer Hub and added to your library'
    const hubTemplates = window.VCV_HUB_GET_TEMPLATES_TEASER()
    let findTemplate = hubTemplates.find(template => template.bundle === bundle)
    if (!findTemplate) {
      return
    }
    let downloadingItems = workspaceStorage.state('downloadingItems').get() || []
    if (downloadingItems.includes(tag)) {
      return
    }

    downloadingItems.push(tag)
    workspaceStorage.state('downloadingItems').set(downloadingItems)

    let tries = 0
    let tryDownload = () => {
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
            // Initialize template depended elements
            if (jsonResponse.elements && Array.isArray(jsonResponse.elements)) {
              jsonResponse.elements.forEach((element) => {
                element.tag = element.tag.replace('element/', '')
                getStorage('hubElements').trigger('add', element, true)
              })
            }
            if (jsonResponse.templates) {
              let template = jsonResponse.templates[ 0 ]
              template.id = template.id.toString()
              storage.trigger('add', template.type, template)
            }
            workspaceStorage.trigger('removeFromDownloading', tag)
          } else {
            tries++
            console.warn('failed to download template status is false', jsonResponse, response)
            if (tries < 2) {
              tryDownload()
            } else {
              let errorMessage = localizations.licenseErrorElementDownload || 'Failed to download template (license is expired or request to account has timed out).'
              if (jsonResponse && jsonResponse.message) {
                errorMessage = jsonResponse.message
              }

              console.warn('failed to download template status is false', errorMessage, response)
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
              text: localizations.defaultErrorTemplateDownload || 'Failed to download template.',
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
        console.warn('failed to download template general server error', response)
        if (tries < 2) {
          tryDownload()
        } else {
          workspaceNotifications.set({
            type: 'error',
            text: localizations.defaultErrorTemplateDownload || 'Failed to download template.',
            showCloseButton: 'true',
            icon: 'vcv-ui-icon vcv-ui-icon-error',
            time: 5000
          })
        }
      }
      utils.startDownload(bundle, data, successCallback, errorCallback)
    }
    tryDownload()
  })

  storage.on('add', (type, templateData) => {
    let all = storage.state('templates').get() || {}
    if (!all[ type ]) {
      all[ type ] = {
        'name': type,
        'type': type,
        'templates': []
      }
    }
    all[ type ].templates.unshift(templateData)
    storage.state('templates').set(all)
  })
  storage.on('remove', (type, id) => {
    let all = storage.state('templates').get() || {}
    if (all[ type ]) {
      let removeIndex = all[ type ].templates.findIndex((template) => {
        return template.id === id
      })
      all[ type ].templates.splice(removeIndex, 1)
      storage.state('templates').set(all)
    }
  })
})
