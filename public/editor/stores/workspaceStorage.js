import MobileDetect from 'mobile-detect'
import { addStorage, getService, getStorage, env } from 'vc-cake'

const createKey = getService('utils').createKey
const cacheStorage = getStorage('cache')

addStorage('workspace', (storage) => {
  const elementsStorage = getStorage('elements')
  const localStorage = getStorage('localStorage')
  const documentManager = getService('document')
  const cook = getService('cook')
  const isElementOneRelation = (parent) => {
    let children = cook.getChildren(parent.tag)
    if (children.length === 1) {
      return children[ 0 ].tag
    }
    return false
  }
  storage.on('add', (id, tag, options) => {
    let element = false
    if (id) {
      element = documentManager.get(id)
    }
    if (element) {
      let oneTag = isElementOneRelation(element)
      if (oneTag) {
        let data = cook.get({ tag: oneTag, parent: id })
        elementsStorage.trigger('add', data.toJS(), true, options)
        return
      }
    }
    if (env('MOBILE_DETECT')) {
      const mobileDetect = new MobileDetect(window.navigator.userAgent)
      if (mobileDetect.mobile() && (mobileDetect.tablet() || mobileDetect.phone())) {
        storage.state('contentStart').set(false)
      }
    }
    storage.state('settings').set({
      action: 'add',
      element: element,
      tag: tag,
      options: options
    })
  })
  storage.on('edit', (id, tag, options) => {
    if (!id) {
      return
    }
    let element = documentManager.get(id)
    if (!element) {
      if (options && options.element) {
        element = options.element
      } else {
        return
      }
    }
    if (env('MOBILE_DETECT')) {
      const mobileDetect = new MobileDetect(window.navigator.userAgent)
      if (mobileDetect.mobile() && (mobileDetect.tablet() || mobileDetect.phone())) {
        storage.state('contentStart').set(false)
      }
    }

    storage.state('settings').set({
      action: 'edit',
      element: element,
      tag: tag,
      options: options
    })
  })
  storage.on('remove', (id) => {
    const settings = storage.state('settings').get()
    if (settings && (settings.action === 'edit' || settings.action === 'add')) {
      storage.state('settings').set({})
    }
    elementsStorage.trigger('remove', id)
  })
  storage.on('clone', (id) => {
    elementsStorage.trigger('clone', id)
  })
  storage.on('copy', (id, tag, options) => {
    let element = documentManager.copy(id)
    let copyData = {
      element,
      options
    }
    storage.state('copyData').set(copyData)
    if (window.localStorage) {
      window.localStorage.setItem('vcv-copy-data', JSON.stringify(copyData))
    }
    env('CACHE_HOVER_CONTROLS') && cacheStorage.trigger('clear', 'controls')
  })
  const markLastChild = (data) => {
    if (data.children.length) {
      let lastChildIndex = data.children.length - 1
      data.children[ lastChildIndex ] = markLastChild(data.children[ lastChildIndex ])
    } else {
      data.lastItem = true
    }
    return data
  }
  const pasteElementAndChildren = (data, parentId, options = {}) => {
    let elementId = createKey()
    options = {
      ...options,
      silent: !data.lastItem,
      skipInitialExtraElements: true
    }
    let element = cook.get({
      ...data.element,
      id: elementId,
      parent: parentId
    })
    let elementData = element.toJS()
    elementsStorage.trigger('add', elementData, true, options)
    data.children.forEach(child => {
      pasteElementAndChildren(child, elementId)
    })
  }
  const pasteAfter = (data, parentId, options = {}) => {
    let elementId = createKey()
    let parentEl = cook.getById(parentId).toJS()
    options = {
      ...options,
      insertAfter: parentId,
      silent: !data.lastItem,
      skipInitialExtraElements: true
    }
    let element = cook.get({
      ...data.element,
      id: elementId,
      parent: parentEl.parent
    })
    let elementData = element.toJS()
    elementsStorage.trigger('add', elementData, true, options)
    data.children.forEach(child => {
      pasteElementAndChildren(child, elementId)
    })
  }
  const pasteEnd = (data, parentId, options = {}) => {
    let elementId = createKey()
    options = {
      ...options,
      silent: !data.lastItem,
      skipInitialExtraElements: true
    }
    let element = cook.get({
      ...data.element,
      id: elementId,
      parent: false
    })
    let elementData = element.toJS()
    elementsStorage.trigger('add', elementData, true, options)
    data.children.forEach(child => {
      pasteElementAndChildren(child, elementId)
    })
  }
  storage.on('paste', (id) => {
    let copyData = (window.localStorage && window.localStorage.getItem('vcv-copy-data')) || storage.state('copyData').get()
    if (!copyData) {
      return
    } else if (copyData.constructor === String) {
      try {
        copyData = JSON.parse(copyData)
      } catch (err) {
        return
      }
    }
    copyData.element = markLastChild(copyData.element)
    pasteElementAndChildren(copyData.element, id, copyData.options)
  })
  storage.on('pasteAfter', (id) => {
    let copyData = (window.localStorage && window.localStorage.getItem('vcv-copy-data')) || storage.state('copyData').get()
    if (!copyData) {
      return
    } else if (copyData.constructor === String) {
      try {
        copyData = JSON.parse(copyData)
      } catch (err) {
        return
      }
    }
    copyData.element = markLastChild(copyData.element)
    pasteAfter(copyData.element, id, copyData.options)
  })
  storage.on('pasteEnd', (id) => {
    let copyData = (window.localStorage && window.localStorage.getItem('vcv-copy-data')) || storage.state('copyData').get()
    if (!copyData) {
      return
    } else if (copyData.constructor === String) {
      try {
        copyData = JSON.parse(copyData)
      } catch (err) {
        return
      }
    }
    copyData.element = markLastChild(copyData.element)
    pasteEnd(copyData.element, id, copyData.options)
  })
  storage.on('move', (id, settings) => {
    elementsStorage.trigger('move', id, settings)
  })
  storage.on('drop', (id, settings) => {
    const relatedElement = settings.related ? cook.get(documentManager.get(settings.related)) : false
    const data = cook.get({ tag: settings.element.tag, parent: relatedElement.get('parent') })
    elementsStorage.trigger('add', data.toJS())
    let movingID = data.get('id')
    if (settings.action !== 'append' && relatedElement.relatedTo([ 'RootElements' ]) && !data.relatedTo([ 'RootElements' ])) {
      movingID = documentManager.getTopParent(movingID)
    }
    elementsStorage.trigger('move', movingID, settings)
    storage.trigger('edit', data.toJS().id, '')
  })
  storage.on('start', () => {
    localStorage.trigger('start')
    storage.state('app').set('started')
  })
  storage.on('addTemplate', () => {
    if (env('MOBILE_DETECT')) {
      const mobileDetect = new MobileDetect(window.navigator.userAgent)
      if (mobileDetect.mobile() && (mobileDetect.tablet() || mobileDetect.phone())) {
        storage.state('contentStart').set(false)
      }
    }
    storage.state('settings').set({
      action: 'addTemplate',
      element: false,
      tag: false,
      options: {}
    })
  })
  storage.on('hide', (id, options) => {
    if (!id) {
      return
    }
    const element = documentManager.get(id)
    if (!element) {
      return
    }

    let newElement = element
    newElement.hidden = !element.hidden
    elementsStorage.trigger('update', id, newElement, '', { hidden: element.hidden, action: 'hide' })
  })
  storage.state('navbarBoundingRect').set({
    resizeTop: 0,
    resizeLeft: 0
  })
  storage.on('removeFromDownloading', (tag) => {
    let downloadingItems = storage.state('downloadingItems').get() || []
    downloadingItems = downloadingItems.filter(downloadingTag => downloadingTag !== tag)
    storage.state('downloadingItems').set(downloadingItems)
  })
})
