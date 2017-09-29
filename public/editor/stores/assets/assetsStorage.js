import { addStorage, getService, getStorage } from 'vc-cake'

import CssBuilder from './lib/cssBuilder'
import LibraryManager from './lib/libraryManager'

addStorage('assets', (storage) => {
  const documentManager = getService('document')
  // const assetsManager = getService('assetsManager')
  const stylesManager = getService('stylesManager')
  const elementAssetsLibrary = getService('elementAssetsLibrary')
  const assetsStorage = getService('modernAssetsStorage')
  const utils = getService('utils')
  const globalAssetsStorage = assetsStorage.getGlobalInstance()
  const settingsStorage = getStorage('settings')
  const assetsWindow = window.document.querySelector('.vcv-layout-iframe').contentWindow
  const builder = new CssBuilder(globalAssetsStorage, elementAssetsLibrary, stylesManager, assetsWindow, utils.slugify)
  const libraryStorage = new LibraryManager()
  const data = { elements: {} }

  storage.on('addElement', (id) => {
    let ids = Array.isArray(id) ? id : [ id ]
    ids.forEach((id) => {
      const element = documentManager.get(id)
      data.elements[ id ] = element
      builder.add(element)
    })
  })
  storage.on('updateElement', (id) => {
    let ids = Array.isArray(id) ? id : [ id ]
    ids.forEach((id) => {
      const element = documentManager.get(id)
      data.elements[ id ] = element
      builder.update(element)
    })
  })
  storage.on('removeElement', (id) => {
    let ids = Array.isArray(id) ? id : [ id ]
    ids.forEach((id) => {
      let tag = data.elements[ id ] ? data.elements[ id ].tag : null
      delete data.elements[ id ]
      builder.destroy(id, tag)
    })
  })
  storage.on('resetElements', () => {
    globalAssetsStorage.resetElements(Object.keys(documentManager.all()))
  })
  storage.on('addSharedLibrary', (data) => {
    let id = data.element.data.id
    libraryStorage.add(id, data)
  })
  const updateSettingsCss = () => {
    const globalCss = settingsStorage.state('globalCss').get() || ''
    const customCss = settingsStorage.state('customCss').get() || ''
    builder.buildSettingsCss(globalCss + customCss)
  }
  settingsStorage.state('globalCss').onChange(updateSettingsCss)
  settingsStorage.state('customCss').onChange(updateSettingsCss)
})
