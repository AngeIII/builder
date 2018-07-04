import { addStorage, getStorage, getService } from 'vc-cake'
import SaveController from './lib/saveController'

addStorage('wordpressData', (storage) => {
  const controller = new SaveController()
  const modernAssetsStorage = getService('modernAssetsStorage')
  const elementsStorage = getStorage('elements')
  const workspaceStorage = getStorage('workspace')
  const settingsStorage = getStorage('settings')
  const hubTemplatesStorage = getStorage('hubTemplates')
  const documentManager = getService('document')
  const wordpressDataStorage = getStorage('wordpressData')
  const utils = getService('utils')
  const cook = getService('cook')
  storage.on('start', () => {
    // Here we call data load
    controller.load(window.vcvSourceID, {}, storage.state('status'))
  })
  storage.on('save', (data, source = '', options = {}) => {
    let status = options && typeof options.status !== 'undefined' ? options.status : storage.state('status')
    status && status.set({ status: 'saving' }, source)
    settingsStorage.state('status').set({ status: 'ready' })
    const documentData = documentManager.all()
    storage.trigger('wordpress:beforeSave', {
      pageElements: documentData
    })
    data = Object.assign({}, {
      elements: documentData
    }, data)
    let id = options && options.id ? options.id : window.vcvSourceID
    controller.save(id, data, status, options)
  })
  const wrapExistingContent = (content) => {
    let textElement = cook.get({ tag: 'textBlock', output: utils.wpAutoP(content, '__VCVID__') })
    if (textElement) {
      elementsStorage.trigger('add', textElement.toJS())
    }
  }
  storage.state('status').set('init')
  storage.state('status').onChange((data) => {
    const { status, request } = data
    if (status === 'loadSuccess') {
      // setData('app:dataLoaded', true) // all call of updating data should goes through data state :)
      const globalAssetsStorage = modernAssetsStorage.getGlobalInstance()
      const customCssState = settingsStorage.state('customCss')
      const globalCssState = settingsStorage.state('globalCss')
      const pageTemplate = settingsStorage.state('pageTemplate')
      const itemPreviewDisabled = settingsStorage.state('itemPreviewDisabled')
      const localJsState = settingsStorage.state('localJs')
      const globalJsState = settingsStorage.state('globalJs')
      /**
       * @typedef {Object} responseData parsed data from JSON
       * @property {Array} globalElements list of global elements
       * @property {string} data saved data
       */
      let responseData = JSON.parse(request || '{}')
      const pageTitleData = responseData.pageTitle ? responseData.pageTitle : {}
      const pageTemplateData = window.VCV_PAGE_TEMPLATES ? window.VCV_PAGE_TEMPLATES() : ''
      const itemPreviewData = responseData.itemPreviewDisabled ? responseData.itemPreviewDisabled : false
      if (responseData.globalElements && responseData.globalElements.length) {
        let globalElements = JSON.parse(responseData.globalElements || '{}')
        globalElements && globalAssetsStorage.setElements(globalElements)
      }
      const initialContent = responseData.post_content
      if ((!responseData.data || !responseData.data.length) && initialContent && initialContent.length) {
        elementsStorage.trigger('reset', {})
        wrapExistingContent(initialContent)
      } else if (responseData.data) {
        let data = { elements: {} }
        try {
          data = JSON.parse(responseData.data ? decodeURIComponent(responseData.data) : '{}')
        } catch (e) {
          console.warn('Failed to parse page elements', e)
          data = { elements: {} }
          // TODO: Maybe attempt to repair truncated js (like loose but not all?)
        }
        elementsStorage.trigger('reset', data.elements || {})
      } else {
        elementsStorage.trigger('reset', {})
      }
      if (responseData.cssSettings && responseData.cssSettings.hasOwnProperty('custom')) {
        customCssState.set(responseData.cssSettings.custom || '')
      }
      if (responseData.cssSettings && responseData.cssSettings.hasOwnProperty('global')) {
        globalCssState.set(responseData.cssSettings.global || '')
      }
      if (responseData.jsSettings && responseData.jsSettings.hasOwnProperty('local')) {
        localJsState.set(responseData.jsSettings.local || '')
      }
      if (responseData.jsSettings && responseData.jsSettings.hasOwnProperty('global')) {
        globalJsState.set(responseData.jsSettings.global || '')
      }
      if (responseData.templates) {
        hubTemplatesStorage.state('templates').set(responseData.templates)
      }
      if (pageTitleData.hasOwnProperty('current')) {
        settingsStorage.state('pageTitle').set(pageTitleData.current)
      }
      if (pageTitleData.hasOwnProperty('disabled')) {
        settingsStorage.state('pageTitleDisabled').set(pageTitleData.disabled)
      }
      if (pageTemplateData.current) {
        pageTemplate.set(pageTemplateData.current)
      }
      if (itemPreviewData) {
        itemPreviewDisabled.set(itemPreviewData)
      }
      storage.state('status').set({ status: 'loaded' })
      settingsStorage.state('status').set({ status: 'ready' })
      workspaceStorage.state('app').set('started')
      window.onbeforeunload = () => {
        const isContentChanged = wordpressDataStorage.state('status').get().status === 'changed'
        const settingsStorageStateGet = settingsStorage.state('status').get()
        const isCssChanged = settingsStorageStateGet &&
          settingsStorageStateGet.status &&
          settingsStorageStateGet.status === 'changed'
        if (isContentChanged || isCssChanged) {
          return 'Changes that you made may not be saved.'
        }
      }
    } else if (status === 'loadFailed') {
      storage.state('status').set({ status: 'loaded' })
      throw new Error('Failed to load loaded')
    }
  })

  const workspaceIFrame = workspaceStorage.state('iframe')
  const workspaceContentState = workspaceStorage.state('content')
  storage.state('status').onChange((data) => {
    const { status } = data
    if (status === 'loadSuccess') {
      onIframeChange()
    }
  })
  settingsStorage.state('pageTitle').onChange(setTitle)
  settingsStorage.state('pageTitleDisabled').onChange(setTitle)
  workspaceIFrame.onChange(onIframeChange)
  let titles = []

  function onIframeChange (data = {}) {
    let { type = 'loaded' } = data
    if (type === 'loaded') {
      let iframe = document.getElementById('vcv-editor-iframe')
      if (iframe) {
        titles = [].slice.call(iframe.contentDocument.querySelectorAll('vcvtitle'))
        setTitle()
      }
    }
  }

  function setTitle () {
    if (!titles) {
      return
    }
    const current = settingsStorage.state('pageTitle').get()
    const disabled = settingsStorage.state('pageTitleDisabled').get()
    titles.forEach(title => {
      title.innerText = current
      title.style.display = disabled ? 'none' : ''
      title.onclick = () => {
        workspaceContentState.set('settings')
      }
    })
  }
})
