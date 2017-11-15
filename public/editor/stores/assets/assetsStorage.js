import { addStorage, getService, getStorage } from 'vc-cake'

import CssBuilder from './lib/cssBuilder'
import AssetsLibraryManager from './lib/assetsLibraryManager'
import ElementLibraryManager from './lib/elementLibraryManager'

addStorage('assets', (storage) => {
  const documentManager = getService('document')
  const stylesManager = getService('stylesManager')
  const elementAssetsLibrary = getService('elementAssetsLibrary')
  const assetsStorage = getService('modernAssetsStorage')
  const utils = getService('utils')
  const globalAssetsStorage = assetsStorage.getGlobalInstance()
  const settingsStorage = getStorage('settings')
  const assetsWindow = window.document.querySelector('.vcv-layout-iframe').contentWindow
  const builder = new CssBuilder(globalAssetsStorage, elementAssetsLibrary, stylesManager, assetsWindow, utils.slugify)
  const assetsLibraryManager = new AssetsLibraryManager()
  const elementLibraryManager = new ElementLibraryManager()
  const data = { elements: {} }

  storage.on('addElement', (id) => {
    let ids = Array.isArray(id) ? id : [ id ]
    ids.forEach((id) => {
      const element = documentManager.get(id)
      data.elements[ id ] = element
      storage.trigger('addSharedLibrary', element)
      builder.add(element)
    })
  })
  storage.on('updateElement', (id, options) => {
    let ids = Array.isArray(id) ? id : [ id ]
    ids.forEach((id) => {
      const element = documentManager.get(id)
      data.elements[ id ] = element
      storage.trigger('editSharedLibrary', element)
      builder.update(element, options)
    })
  })
  storage.on('removeElement', (id) => {
    let ids = Array.isArray(id) ? id : [ id ]
    ids.forEach((id) => {
      let tag = data.elements[ id ] ? data.elements[ id ].tag : null
      delete data.elements[ id ]
      builder.destroy(id, tag)
      storage.trigger('removeSharedLibrary', id)
    })
  })
  storage.on('resetElements', () => {
    globalAssetsStorage.resetElements(Object.keys(documentManager.all()))
  })
  storage.on('updateAllElements', (data) => {
    Object.values(data).forEach(element => {
      storage.trigger('addSharedLibrary', element)
      builder.add(element, true)
    })
  })
  storage.on('addSharedLibrary', (element) => {
    let id = element.id
    assetsLibraryManager.add(id, element)
  })
  storage.on('editSharedLibrary', (element) => {
    let id = element.id
    assetsLibraryManager.edit(id, element)
  })
  storage.on('removeSharedLibrary', (id) => {
    assetsLibraryManager.remove(id)
  })
  storage.on('addElementLibrary', (element, library) => {
    elementLibraryManager.add(element, library)
  })
  storage.on('removeElementLibrary', (element, library) => {
    elementLibraryManager.remove(element, library)
  })
  storage.on('editElementLibrary', (element, addLibrary, removeLibrary) => {
    elementLibraryManager.remove(element, removeLibrary)
    elementLibraryManager.add(element, addLibrary)
  })
  const updateSettingsCss = () => {
    const globalCss = settingsStorage.state('globalCss').get() || ''
    const customCss = settingsStorage.state('customCss').get() || ''
    builder.buildSettingsCss(globalCss + customCss)
  }
  settingsStorage.state('globalCss').onChange(updateSettingsCss)
  settingsStorage.state('customCss').onChange(updateSettingsCss)
})
