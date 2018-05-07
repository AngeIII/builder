import { addService, getService, getStorage, env } from 'vc-cake'

const utils = getService('utils')
const documentManager = getService('document')
let getType = {}.toString

let handleSaveRequest = (action, key, data, successCallback, errorCallback) => {
  let ajax = getService('utils').ajax

  return ajax({
    'vcv-action': `editorTemplates:${action}:adminNonce`,
    'vcv-nonce': window.vcvNonce,
    'vcv-template-type': (window.VCV_EDITOR_TYPE && window.VCV_EDITOR_TYPE()) || 'default',
    [ key ]: data
  }, (result) => {
    let response = JSON.parse(result.response)
    if (response && response.status) {
      successCallback && typeof successCallback === 'function' && successCallback(response)
    } else {
      errorCallback && typeof errorCallback === 'function' && errorCallback(response)
    }
  }, errorCallback)
}

addService('myTemplates', {
  add (name, data, html, successCallback, errorCallback) {
    if (this.findBy('name', name)) {
      return false
    }
    getStorage('wordpressData').trigger('save', {}, '', {
      id: 'template',
      title: name,
      status: false,
      successCallback: (responseText) => {
        try {
          let response = JSON.parse(responseText)
          if (!response.status || !response.postData || !response.postData.id) {
            console.log('Failed to save template, no ID', responseText)
            errorCallback && typeof errorCallback === 'function' && errorCallback()
          } else {
            let id = response.postData.id
            let templateData = { id: id.toString(), name: name, data: data, html: html }
            getStorage('hubTemplates').trigger('add', 'custom', templateData)
            successCallback && typeof successCallback === 'function' && successCallback()
          }
        } catch (e) {
          console.log('Failed to save template', e, responseText)
          errorCallback && typeof errorCallback === 'function' && errorCallback()
        }
      },
      errorCallback: () => {
        errorCallback && typeof errorCallback === 'function' && errorCallback()
      }
    })

    return true
  },
  addCurrentLayout (name, successCallback, errorCallback) {
    let currentLayout = documentManager.all()
    const iframe = document.getElementById('vcv-editor-iframe')
    const contentLayout = iframe ? iframe.contentWindow.document.querySelector('[data-vcv-module="content-layout"]') : false
    let currentLayoutHtml = contentLayout ? utils.normalizeHtml(contentLayout.innerHTML) : ''
    if (getType.call(name) === '[object String]' && name.length) {
      return this.add(name, currentLayout, currentLayoutHtml, successCallback, errorCallback)
    }
    return false
  },
  remove (id, successCallback, errorCallback) {
    handleSaveRequest('delete', 'vcv-template-id', id, (response) => {
      getStorage('hubTemplates').trigger('remove', 'custom', id)
      successCallback && typeof successCallback === 'function' && successCallback()
    }, errorCallback)
  },
  get (id) {
    let myTemplates = this.all()
    return myTemplates.find((template) => {
      return template.id === id
    })
  },
  findBy (key, value) {
    return this.getAllTemplates().find((template) => {
      return template[ key ] && template[ key ] === value
    })
  },
  all (filter = null, sort = null, data) {
    let custom = env('TEMPLATE_PANEL_PERF') ? data && data.custom : getStorage('hubTemplates').state('templates').get().custom
    let myTemplates
    if (env('THEME_EDITOR')) {
      let customTemplates = custom && custom.templates ? custom.templates : []
      let customHeader = this.customHeader(data)
      let customFooter = this.customFooter(data)
      let customSidebar = this.customSidebar(data)
      let customHeaderTemplates = customHeader && customHeader.templates ? customHeader.templates : []
      let customFooterTemplates = customFooter && customFooter.templates ? customFooter.templates : []
      let customSidebarTemplates = customSidebar && customSidebar.templates ? customSidebar.templates : []

      myTemplates = customTemplates.concat(customHeaderTemplates, customFooterTemplates, customSidebarTemplates)
    } else {
      myTemplates = custom && custom.templates ? custom.templates : []
    }
    if (filter && filter.constructor === Function) {
      myTemplates = myTemplates.filter(filter)
    }
    if (sort && sort.constructor === Function) {
      myTemplates.sort(sort)
    } else if (sort === 'name') {
      myTemplates.sort((a, b) => {
        return a.name ? a.name.localeCompare(b.name, { kn: true }, { sensitivity: 'base' }) : -1
      })
    }
    return myTemplates
  },
  predefined (data) {
    let predefinedTemplates = env('TEMPLATE_PANEL_PERF') ? data || getStorage('hubTemplates').state('templates').get().predefined : getStorage('hubTemplates').state('templates').get().predefined
    return predefinedTemplates && predefinedTemplates.templates ? predefinedTemplates.templates : []
  },
  hub (data) {
    let hubTemplates = env('TEMPLATE_PANEL_PERF') ? data || getStorage('hubTemplates').state('templates').get().hub : getStorage('hubTemplates').state('templates').get().hub
    return hubTemplates && hubTemplates.templates ? hubTemplates.templates : []
  },
  findTemplateByBundle (bundle) {
    const allTemplates = getStorage('hubTemplates').state('templates').get() || {}
    delete allTemplates.custom
    let template = false
    const templatesTypes = Object.keys(allTemplates)
    for (let i = 0; i < templatesTypes.length; i++) {
      const type = templatesTypes[ i ]
      const hubTemplates = allTemplates[ type ] || []
      if (hubTemplates.templates) {
        template = hubTemplates.templates.find((hubTemplate) => {
          return hubTemplate.bundle === bundle ? hubTemplate : false
        })
        if (template) {
          break
        }
      }
    }
    return template
  },
  hubAndPredefined (data) {
    let hubAndPredefined = env('TEMPLATE_PANEL_PERF') ? data && this.hub(data.hub).concat(this.predefined(data.predefined)) : this.hub().concat(this.predefined())
    return hubAndPredefined || []
  },
  hubHeader (data) {
    let hubHeaderTemplates = env('TEMPLATE_PANEL_PERF') ? data : getStorage('hubTemplates').state('templates').get().hubHeader
    return hubHeaderTemplates && hubHeaderTemplates.templates ? hubHeaderTemplates.templates : []
  },
  hubFooter (data) {
    let hubFooterTemplates = env('TEMPLATE_PANEL_PERF') ? data : getStorage('hubTemplates').state('templates').get().hubFooter
    return hubFooterTemplates && hubFooterTemplates.templates ? hubFooterTemplates.templates : []
  },
  hubSidebar (data) {
    let hubSidebarTemplates = env('TEMPLATE_PANEL_PERF') ? data : getStorage('hubTemplates').state('templates').get().hubSidebar
    return hubSidebarTemplates && hubSidebarTemplates.templates ? hubSidebarTemplates.templates : []
  },
  customHeader (data) {
    let customHeaderTemplates = env('TEMPLATE_PANEL_PERF') ? data && data.customHeaders : getStorage('hubTemplates').state('templates').get().customHeaders
    return customHeaderTemplates && customHeaderTemplates.templates ? customHeaderTemplates.templates : []
  },
  customFooter (data) {
    let customFooterTemplates = env('TEMPLATE_PANEL_PERF') ? data && data.customFooter : getStorage('hubTemplates').state('templates').get().customFooter
    return customFooterTemplates && customFooterTemplates.templates ? customFooterTemplates.templates : []
  },
  customSidebar (data) {
    let customSidebaremplates = env('TEMPLATE_PANEL_PERF') ? data && data.customSidebar : getStorage('hubTemplates').state('templates').get().customSidebar
    return customSidebaremplates && customSidebaremplates.templates ? customSidebaremplates.templates : []
  },
  getAllTemplates (filter = null, sort = null, data) {
    let allTemplatesGroups = env('TEMPLATE_PANEL_PERF') ? data || {} : getStorage('hubTemplates').state('templates').get() || {}
    let allTemplates = []
    for (let key in allTemplatesGroups) {
      allTemplates = allTemplates.concat(allTemplatesGroups[ key ].templates)
    }
    if (filter && filter.constructor === Function) {
      allTemplates = allTemplates.filter(filter)
    }
    if (sort && sort.constructor === Function) {
      allTemplates.sort(sort)
    } else if (sort === 'name') {
      allTemplates.sort((a, b) => {
        return a.name ? a.name.localeCompare(b.name, { kn: true }, { sensitivity: 'base' }) : -1
      })
    }
    return allTemplates
  },
  getTemplateData () {
    let data = {}
    let storageData = getStorage('hubTemplates').state('templates').get()
    if (storageData) {
      data.getAllTemplates = this.getAllTemplates(null, null, storageData)
      data.all = this.all(null, null, storageData)
      data.hubAndPredefined = this.hubAndPredefined(storageData)
      data.hubHeader = this.hubHeader(storageData.hubHeader)
      data.hubFooter = this.hubFooter(storageData.hubFooter)
      data.hubSidebar = this.hubSidebar(storageData.hubSidebar)
    }
    return data
  },
  getLiteVersionTemplates () {
    // TODO get lite version templates from hub
    return this.getAllTemplates()
  }
})
