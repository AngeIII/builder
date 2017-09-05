import vcCake from 'vc-cake'

const dataProcessor = vcCake.getService('dataProcessor')
const elementAssetsLibrary = vcCake.getService('elementAssetsLibrary')
const stylesManager = vcCake.getService('stylesManager')
const modernAssetsStorage = vcCake.getService('modernAssetsStorage')
const utils = vcCake.getService('utils')
const settingsStorage = vcCake.getStorage('settings')
const cook = vcCake.getService('cook')

export default class SaveController {
  ajax (data, successCallback, failureCallback) {
    dataProcessor.appAllDone().then(() => {
      dataProcessor.appServerRequest(data).then(successCallback, failureCallback)
    })
  }
  /**
   * Send data to server
   * @param data
   * @param status
   * @private
   */
  save (data, status, callback, action = '') {
    const iframe = document.getElementById('vcv-editor-iframe')
    const contentLayout = iframe ? iframe.contentWindow.document.querySelector('[data-vcv-module="content-layout"]') : false
    let content = contentLayout ? utils.normalizeHtml(contentLayout.innerHTML) : ''
    let globalStyles = ''
    let pageStyles = ''
    let promises = []
    const globalAssetsStorageInstance = modernAssetsStorage.getGlobalInstance()
    let globalStylesManager = stylesManager.create()
    globalStylesManager.add(globalAssetsStorageInstance.getSiteCssDataNG())
    promises.push(globalStylesManager.compile().then((result) => {
      globalStyles = result
    }))
    const localStylesManager = stylesManager.create()
    localStylesManager.add(globalAssetsStorageInstance.getPageCssDataNG())
    promises.push(localStylesManager.compile().then((result) => {
      pageStyles = result
    }))
    let assetsFiles = {
      jsBundles: [],
      cssBundles: []
    }
    const elementsCss = {}
    Object.keys(data.elements).forEach((key) => {
      const cookElement = cook.get(data.elements[key])
      const tag = cookElement.get('tag')
      elementsCss[key] = {
        tag: tag
      }
      let elementAssetsFiles = elementAssetsLibrary.getAssetsFilesByElement(cookElement)
      assetsFiles.cssBundles = assetsFiles.cssBundles.concat(elementAssetsFiles.cssBundles)
      assetsFiles.jsBundles = assetsFiles.jsBundles.concat(elementAssetsFiles.jsBundles)
      const elementBaseStyleManager = stylesManager.create()
      const elementAttributesStyleManager = stylesManager.create()
      const elementMixinsStyleManager = stylesManager.create()
      const baseCss = globalAssetsStorageInstance.getCssDataByElement(data.elements[key], { attributeMixins: false, cssMixins: false })
      const attributesCss = globalAssetsStorageInstance.getCssDataByElement(data.elements[key], { tags: false, cssMixins: false })
      const mixinsCss = globalAssetsStorageInstance.getCssDataByElement(data.elements[key], { tags: false, attributeMixins: false })
      promises.push(elementBaseStyleManager.add(baseCss).compile().then((result) => {
        elementsCss[key].baseCss = result
      }))
      promises.push(elementAttributesStyleManager.add(attributesCss).compile().then((result) => {
        elementsCss[key].attributesCss = result
      }))
      promises.push(elementMixinsStyleManager.add(mixinsCss).compile().then((result) => {
        elementsCss[key].mixinsCss = result
      }))
    })
    assetsFiles.cssBundles = [ ...new Set(assetsFiles.cssBundles) ]
    assetsFiles.jsBundles = [ ...new Set(assetsFiles.jsBundles) ]
    Promise.all(promises).then(() => {
      // if (iframe && iframe.contentWindow && iframe.contentWindow.document.querySelector('[data-vcv-module="content-layout"]')) {
      if (window.switchEditors && window.tinymce) {
        window.switchEditors.go('content', 'html')
      }
      document.getElementById('content').value = '<!--vcv no formatting start-->' + content + '<!--vcv no formatting end-->'
      document.getElementById('vcv-backend').value = '1'
      document.getElementById('vcv-action').value = `set${action}Data:adminNonce`
      document.getElementById('vcv-data').value = encodeURIComponent(JSON.stringify(data))
      document.getElementById('vcv-global-elements-css').value = globalStyles
      document.getElementById('vcv-elements-css-data').value = encodeURIComponent(JSON.stringify(elementsCss))
      document.getElementById('vcv-source-css').value = pageStyles
      document.getElementById('vcv-source-assets-files').value = encodeURIComponent(JSON.stringify(assetsFiles))
      document.getElementById('vcv-settings-source-custom-css').value = settingsStorage.state('customCss').get() || ''
      document.getElementById('vcv-settings-global-css').value = settingsStorage.state('globalCss').get() || ''
      document.getElementById('vcv-tf').value = 'noGlobalCss'
      if (typeof callback === 'function') {
        callback('success')
      }
      status.set({
        status: 'success'
      })
    })
  }

  load = (data, status) => {
    this.ajax(
      {
        'vcv-action': 'getData:adminNonce',
        'vcv-data': encodeURIComponent(JSON.stringify(data)),
        'vcv-source-id': window.vcvSourceID
      },
      this.loadSuccess.bind(this, status),
      this.loadFailed.bind(this, status)
    )
  }

  loadSuccess = (status, request) => {
    status.set({
      status: 'loadSuccess',
      request: request
    })
    // this.props.api.request('wordpress:data:loaded', {
    //   status: 'success',
    //   request: request
    // })
  }

  loadFailed = (status, request) => {
    status.set({
      status: 'loadFailed',
      request: request
    })
    // this.props.api.request('wordpress:data:loaded', {
    // status: 'failed',
    // request: request
    // })
  }
}
