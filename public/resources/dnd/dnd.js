import $ from 'jquery'
import _ from 'lodash'
import { getService, setData, getData, getStorage } from 'vc-cake'
import SmartLine from './smartLine'
import Helper from './helper'
import HelperClone from './helperClone'
import Api from './api'
import DOMElement from './domElement'

const documentManager = getService('document')
const cook = getService('cook')
const hubCategories = getService('hubCategories')
const workspaceStorage = getStorage('workspace')

export default class DnD {
  /**
   * Drag&drop builder.
   *
   * @param {string} container DOMNode to use as container
   * @param {Object} options Settings for Dnd builder to define how it should interact with layout
   * @constructor
   */
  constructor (container, options) {
    Object.defineProperties(this, {
      /**
       * @memberOf! DnD
       */
      helper: {
        enumerable: false,
        configurable: false,
        writable: true,
        value: null
      },
      /**
       * @memberOf! DnD
       */
      position: {
        enumerable: false,
        configurable: false,
        writable: true,
        value: null
      },
      /**
       * @memberOf! DnD
       */
      placeholder: {
        enumerable: false,
        configurable: false,
        writable: true,
        value: null
      },
      /**
       * @memberOf! DnD
       */
      currentElement: {
        enumerable: false,
        configurable: false,
        writable: true,
        value: null
      },
      /**
       * @memberOf! DnD
       */
      draggingElement: {
        enumerable: false,
        configurable: false,
        writable: true,
        value: null
      },
      /**
       * @memberOf! DnD
       */
      point: {
        enumerable: false,
        configurable: false,
        writable: true,
        value: null
      },
      /**
       * @memberOf! DnD
       */
      hover: {
        enumerable: false,
        configurable: false,
        writable: true,
        value: ''
      },
      /**
       * @memberOf! DnD
       */
      items: {
        enumerable: false,
        configurable: false,
        writable: true,
        value: {}
      },
      /**
       * @memberOf! DnD
       */
      container: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: container
      },
      /**
       * @memberOf! DnD
       */
      manualScroll: {
        enumerable: false,
        configurable: false,
        writable: true,
        value: false
      },
      /**
       * @memberOf! DnD
       */
      options: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: _.defaults(options, {
          cancelMove: false,
          moveCallback: function () {
          },
          dropCallback: function () {
          },
          startCallback: function () {
          },
          endCallback: function () {
          },
          document: document,
          container: document.body,
          boundariesGap: 10,
          rootContainerFor: [ 'RootElements' ],
          rootID: 'vcv-content-root',
          handler: null,
          ignoreHandling: null,
          disabled: false,
          helperType: null,
          manualScroll: false,
          drop: false
        })
      }
    })
  }

  static api (dnd) {
    return new Api(dnd)
  }

  option (name, value) {
    this.options[ name ] = value
  }

  init () {
    this.items[ this.options.rootID ] = new DOMElement(this.options.rootID, this.container, {
      containerFor: this.options.rootContainerFor
    })
    this.handleDragFunction = this.handleDrag.bind(this)
    this.handleDragStartFunction = this.handleDragStart.bind(this)
    this.handleDragEndFunction = this.handleDragEnd.bind(this)
    this.handleRightMouseClickFunction = this.handleRightMouseClick.bind(this)
  }

  addItem (id) {
    let element = cook.get(documentManager.get(id))
    if (!element) { return }
    let containerFor = element.get('containerFor')
    let relatedTo = element.get('relatedTo')
    let domNode = this.container.querySelector('[data-vcv-element="' + id + '"]')
    if (!domNode || !domNode.ELEMENT_NODE) { return }
    this.items[ id ] = new DOMElement(id, domNode, {
      containerFor: containerFor ? containerFor.value : null,
      relatedTo: relatedTo ? relatedTo.value : null,
      parent: element.get('parent') || this.options.rootID,
      handler: this.options.handler,
      tag: element.get('tag'),
      iconLink: hubCategories.getElementIcon(element.get('tag'))
    })
      .on('dragstart', function (e) { e.preventDefault() })
      .on('mousedown', this.handleDragStartFunction)
      .on('mousedown', this.handleDragFunction)
  }

  updateItem (id) {
    if (!this.items[ id ]) { return }
    this.items[ id ]
      .refresh()
      .off('mousedown', this.handleDragStartFunction)
      .off('mousedown', this.handleDragFunction)
      .on('dragstart', function (e) { e.preventDefault() })
      .on('mousedown', this.handleDragStartFunction)
      .on('mousedown', this.handleDragFunction)
  }

  removeItem (id) {
    this.items[ id ] && this.items[ id ]
      .off('mousedown', this.handleDragStartFunction)
      .off('mousedown', this.handleDragFunction)
    delete this.items[ id ]
  }

  removePlaceholder () {
    if (this.placeholder !== null) {
      this.placeholder.remove()
      this.placeholder = null
    }
  }

  findElementWithValidParent (domElement) {
    let parentElement = domElement.parent() ? this.items[ domElement.parent() ] : null
    if (parentElement && this.draggingElement.isChild(parentElement)) {
      return domElement
    } else if (parentElement) {
      return this.findElementWithValidParent(parentElement)
    }
    return null
  }

  isDraggingElementParent (domElement) {
    return domElement.$node.parents('[data-vcv-dnd-element="' + this.draggingElement.id + '"]').length > 0
  }

  findDOMNode (point) {
    let domNode = this.options.document.elementFromPoint(point.x, point.y)
    const domNodeAttr = domNode && domNode.getAttribute('data-vcv-dnd-element')
    if (domNode && !domNodeAttr) {
      domNode = $(domNode).closest('[data-vcv-dnd-element]:not([data-vcv-dnd-element="vcv-content-root"])').get(0)
    }
    if (domNode && domNodeAttr && domNodeAttr === 'vcv-content-root') {
      domNode = null
    }
    return domNode || null
  }

  checkItems (point) {
    let domNode = this.findDOMNode(point)
    if (!domNode || !domNode.ELEMENT_NODE) { return }
    let domElement = this.items[ domNode.getAttribute('data-vcv-dnd-element') ]
    if (!domElement) {
      return
    }
    let parentDOMElement = this.items[ domElement.parent() ] || null
    if (domElement.isNearBoundaries(point, this.options.boundariesGap) && parentDOMElement && parentDOMElement.id !== this.options.rootID) {
      domElement = this.findElementWithValidParent(parentDOMElement) || domElement
      parentDOMElement = this.items[ domElement.parent() ] || null
    }
    if (this.isDraggingElementParent(domElement)) {
      return
    }
    let position = this.placeholder.redraw(domElement.node, point, {
      allowBeforeAfter: parentDOMElement && this.draggingElement.isChild(parentDOMElement),
      allowAppend: !this.isDraggingElementParent(domElement) &&
      domElement && this.draggingElement.isChild(domElement) &&
      !documentManager.children(domElement.id).length
    })

    if (position) {
      this.point = point
      this.setPosition(position)
      this.currentElement = domElement.id
      this.placeholder.setCurrentElement(domElement.id)
    }
  }

  setPosition (position) {
    this.position = position
  }

  start (id, point, tag, domNode) {
    if (!this.dragStartHandled) {
      this.dragStartHandled = true
    }
    if (id && tag) {
      this.draggingElement = this.createDraggingElementFromTag(tag, domNode)
    } else {
      this.draggingElement = id ? this.items[ id ] : null
      this.options.drop = false
      if (!this.draggingElement) {
        this.draggingElement = null
        return false
      }
    }

    this.options.document.addEventListener('mousedown', this.handleRightMouseClickFunction, false)
    this.options.document.addEventListener('mouseup', this.handleDragEndFunction, false)
    // Create helper/clone of element
    if (this.options.helperType === 'clone') {
      this.helper = new HelperClone(this.draggingElement.node, point)
    } else {
      this.helper = new Helper(this.draggingElement, {
        container: this.options.container
      })
    }

    // Add css class for body to enable visual settings for all document
    this.options.document.body.classList.add('vcv-dnd-dragging--start', 'vcv-is-no-selection')

    this.watchMouse()
    this.createPlaceholder()
    this.scrollEvent = () => {
      if (this.placeholder) {
        this.placeholder.clearStyle()
        this.placeholder.setPoint(0, 0)
      }
      this.check(this.point || {})
    }
    this.options.document.addEventListener('scroll', this.scrollEvent)
    if (typeof this.options.startCallback === 'function') {
      this.options.startCallback(this.draggingElement)
    }
    window.setTimeout(() => {
      this.helper && this.helper.show()
    }, 200)
  }
  createDraggingElementFromTag (tag, domNode) {
    let element = cook.get({tag: tag})
    if (!element) { return }
    let containerFor = element.get('containerFor')
    let relatedTo = element.get('relatedTo')
    return new DOMElement('dropElement', domNode, {
      containerFor: containerFor ? containerFor.value : null,
      relatedTo: relatedTo ? relatedTo.value.concat(['RootElements']) : null,
      parent: this.options.rootID,
      handler: this.options.handler,
      tag: element.get('tag'),
      iconLink: hubCategories.getElementIcon(element.get('tag'))
    })
  }
  end () {
    // Remove helper
    this.helper && this.helper.remove()
    // Remove css class for body
    this.options.document.body.classList.remove('vcv-dnd-dragging--start', 'vcv-is-no-selection')

    this.forgetMouse()
    this.removePlaceholder()
    this.options.document.removeEventListener('scroll', this.scrollEvent)
    this.point = null
    this.options.manualScroll = false
    if (typeof this.options.endCallback === 'function') {
      this.options.endCallback(this.draggingElement)
    }
    if (this.options.drop === true && this.draggingElement && typeof this.options.dropCallback === 'function') {
      this.position && this.options.dropCallback(
        this.draggingElement.id,
        this.position,
        this.currentElement,
        this.draggingElement
      )
      if (!this.position) {
        workspaceStorage.state('drag').set({ terminate: true })
      }
    } else if (this.draggingElement && typeof this.options.moveCallback === 'function' && this.draggingElement.id !== this.currentElement) {
      this.position && this.options.moveCallback(
        this.draggingElement.id,
        this.position,
        this.currentElement
      )
    }
    this.draggingElement = null
    this.currentElement = null
    this.position = null
    this.helper = null
    this.startPoint = null
    if (getData('vcv:layoutCustomMode') !== 'contentEditable' && getData('vcv:layoutCustomMode') !== 'columnResizer' && getData('vcv:layoutCustomMode') !== null) {
      setData('vcv:layoutCustomMode', null)
    }
    // Set callback on dragEnd
    this.options.document.removeEventListener('mouseup', this.handleDragEndFunction, false)
  }

  scrollManually (point) {
    let body = this.options.document.body
    let clientHeight = this.options.document.documentElement.clientHeight
    let top = null
    let speed = 30
    let gap = 10
    if (clientHeight - gap <= point.y) {
      top = body.scrollTop + speed
    } else if (point.y <= gap && body.scrollTop >= speed) {
      top = body.scrollTop - speed
    }
    if (top !== null) {
      body.scrollTop = top > 0 ? top : 0
    }
  }

  check (point = null) {
    if (this.options.disabled === true) {
      this.handleDragEnd()
      return
    }
    if (getData('vcv:layoutCustomMode') !== 'dnd') {
      setData('vcv:layoutCustomMode', 'dnd')
    }
    this.options.manualScroll && this.scrollManually(point)
    window.setTimeout(() => {
      if (!this.startPoint) {
        this.startPoint = point
      }
    }, 0)
    this.helper && this.helper.setPosition(point)
    this.placeholder && this.checkItems(point)
  }

  // Mouse events
  watchMouse () {
    this.options.document.addEventListener('mousemove', this.handleDragFunction, false)
  }

  forgetMouse () {
    this.options.document.removeEventListener('mousemove', this.handleDragFunction, false)
  }

  createPlaceholder () {
    this.placeholder = new SmartLine(_.pick(this.options, 'document', 'container'))
  }

  /**
   * Drag handlers
   */
  handleDrag (e) {
    // disable dnd on right button click
    if (e.button && e.button === 2) {
      this.handleDragEnd()
      return false
    }
    e.clientX !== undefined && e.clientY !== undefined && this.check({ x: e.clientX, y: e.clientY })
  }

  /**
   * @param {object} e Handled event
   */
  handleDragStart (e) {
    if (this.options.disabled === true || this.dragStartHandled) { // hack not to use stopPropogation
      return
    }
    if (this.options.ignoreHandling && $(e.currentTarget).is(this.options.ignoreHandling)) {
      return
    }
    if (e.which > 1) {
      return
    }
    let id = e.currentTarget.getAttribute('data-vcv-dnd-element-handler')
    this.start(id, { x: e.clientX, y: e.clientY })
  }

  handleDragEnd () {
    this.dragStartHandled = false
    this.end()
  }

  handleRightMouseClick (e) {
    if (e.button && e.button === 2) {
      this.options.document.removeEventListener('mousedown', this.handleRightMouseClickFunction, false)
      this.handleDragEnd()
    }
  }
}
