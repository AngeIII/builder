import vcCake from 'vc-cake'
import ControlsHandler from './controlsHandler'
import OutlineHandler from './outlineHandler'

const layoutStorage = vcCake.getStorage('layout')
const workspaceStorage = vcCake.getStorage('workspace')
const workspaceContentStartState = workspaceStorage.state('contentStart')

export default class ControlsManager {
  constructor (api) {
    Object.defineProperties(this, {
      /**
       * @memberOf! ControlsManager
       */
      api: {
        value: api,
        writable: false,
        enumerable: false,
        configurable: false
      }
    })

    this.state = {
      prevTarget: null,
      prevElement: null,
      prevElementPath: [],
      showOutline: true,
      showControls: true
    }

    this.findElement = this.findElement.bind(this)
    this.controlElementFind = this.controlElementFind.bind(this)
  }

  /**
   * Setup
   */
  setup (options) {
    // get system data
    this.iframeContainer = options.iframeContainer
    this.iframeOverlay = options.iframeOverlay
    this.iframe = options.iframe
    this.iframeWindow = options.iframeWindow
    this.iframeDocument = options.iframeDocument
    this.editRowId = null

    let systemData = {
      iframeContainer: this.iframeContainer,
      iframeOverlay: this.iframeOverlay,
      iframe: this.iframe,
      iframeWindow: this.iframeWindow,
      iframeDocument: this.iframeDocument
    }

    // define helpers
    Object.defineProperties(this, {
      /**
       * @memberOf! OutlineManager
       */
      outline: {
        value: new OutlineHandler(systemData),
        writable: false,
        enumerable: false,
        configurable: false
      },
      /**
       * @memberOf! ControlsManager
       */
      controls: {
        value: new ControlsHandler(systemData),
        writable: false,
        enumerable: false,
        configurable: false
      }
    })

    // Subscribe to main event to interact with content elements
    document.body.addEventListener('mousemove', this.findElement)
  }

  /**
   * Find element by event and run cake events on element over and out
   * @param e
   */
  findElement (e = null) {
    // need to run all events, so creating fake event
    if (!e) {
      e = {
        target: null
      }
    }
    if (e.target !== this.prevTarget) {
      this.prevTarget = e.target
      // get all vcv elements
      let path = this.getPath(e)
      let elPath = []
      // check if elements are inside backend layout
      if (e.target && e.target.closest('.vcv-wpbackend-layout')) {
        path.forEach((el) => {
          if (el.hasAttribute && el.hasAttribute('data-vcv-element')) {
            elPath.push(el)
          }
        })
      }
      let element = null
      if (elPath && elPath.length) {
        element = elPath[ 0 ] // first element in path always hovered element
      }
      let control = path.find((el) => {
        return el.classList && el.classList.contains('vcv-ui-append-control') || el.classList && el.classList.contains('vcv-ui-outline-controls')
      })

      if (this.prevElement !== element) {
        // return to show element controls
        if (control) {
          return
        }
        // unset prev element
        if (this.prevElement) {
          // this.api.request('editorContent:element:mouseLeave', {
          layoutStorage.state('interactWithContent').set({
            type: 'mouseLeave',
            element: this.prevElement,
            vcElementId: this.prevElement.dataset.vcvElement,
            path: this.prevElementPath,
            vcElementsPath: this.prevElementPath.map((el) => {
              return el.dataset.vcvElement
            })
          })
        }
        // set new element
        if (element) {
          // this.api.request('editorContent:element:mouseEnter', {
          layoutStorage.state('interactWithContent').set({
            type: 'mouseEnter',
            element: element,
            vcElementId: element.dataset.vcvElement,
            path: elPath,
            vcElementsPath: elPath.map((el) => {
              return el.dataset.vcvElement
            })
          })
        }

        this.prevElement = element
        this.prevElementPath = elPath
      }
    }
  }

  /**
   * Event.path shadow dom polyfill
   * @param e
   * @returns {*}
   */
  getPath (e) {
    if (e.path) {
      return e.path
    }
    let path = []
    let node = e.target

    while (node) {
      path.push(node)
      node = node.parentNode
    }
    return path
  }

  /**
   * Initialize
   */
  init (options = {}) {
    let defaultOptions = {
      iframeUsed: true,
      iframeContainer: document.querySelector('.vcv-layout-iframe-container'),
      iframeOverlay: document.querySelector('#vcv-editor-iframe-overlay'),
      iframe: document.querySelector('#vcv-editor-iframe')
    }
    defaultOptions.iframeWindow = defaultOptions.iframe && defaultOptions.iframe.contentWindow
    defaultOptions.iframeDocument = defaultOptions.iframeWindow && defaultOptions.iframeWindow.document

    options = Object.assign({}, defaultOptions, options)
    this.setup(options)

    // Check custom layout mode
    vcCake.onDataChange('vcv:layoutCustomMode', (state) => {
      this.state.showOutline = !state
      this.state.showControls = !state
      this.findElement()
      this.controlElementFind()
    })

    // check remove element
    this.api.reply('data:remove', () => {
      this.findElement()
      this.controlElementFind()
    })

    // Interact with content
    this.interactWithContent()

    // interact with controls
    this.interactWithControls()

    // interact with tree
    this.interactWithTree()
  }

  /**
   * Interact with content
   */
  interactWithContent () {
    // Controls interaction
    // this.api.reply('editorContent:element:mouseEnter', (data) => {
    //   if (this.state.showControls) {
    //     this.controls.show(data)
    //   }
    // })
    // this.api.reply('editorContent:element:mouseLeave', () => {
    //   this.controls.hide()
    // })
    layoutStorage.state('interactWithContent').onChange((data) => {
      if (data && data.type === 'mouseEnter') {
        if (this.state.showControls) {
          this.controls.show(data)
        }
      }
      if (data && data.type === 'mouseLeave') {
        this.controls.hide()
      }
    })
  }

  /**
   * Interact with tree
   */
  interactWithTree () {
    workspaceStorage.state('userInteractWith').onChange((id = false) => {
      if (id && this.state.showOutline) {
        let element = this.iframeContainer.querySelector(`[data-vcv-element="${id}"]:not([data-vcv-interact-with-controls="false"])`)
        if (element) {
          this.outline.show(element, id)
        }
      } else {
        this.outline.hide()
      }
    })
  }

  /**
   * Handle control click
   */
  handleControlClick (controlsContainer, e) {
    e && e.button === 0 && e.preventDefault()
    if (e.button === 0) {
      let path = this.getPath(e)
      // search for event
      let i = 0
      let el = null
      while (i < path.length && path[ i ] !== controlsContainer) {
        if (path[ i ].dataset && path[ i ].dataset.vcControlEvent) {
          el = path[ i ]
          i = path.length
        }
        i++
      }
      if (el) {
        let event = el.dataset.vcControlEvent
        let tag = el.dataset.vcControlEventOptions || false
        let options = {
          insertAfter: el.dataset.vcControlEventOptionInsertAfter || false
        }
        let elementId = el.dataset.vcvElementId
        if (event === 'treeView') {
          workspaceContentStartState.set('treeView', elementId)
        } else if (event === 'edit') {
          if (workspaceContentStartState.get() === 'treeView') {
            workspaceContentStartState.set('treeView', elementId)
          }
          workspaceStorage.trigger(event, elementId, tag, options)
        } else if (event === 'remove') {
          this.findElement()
          this.controlElementFind()
          this.iframeDocument.body.removeEventListener('mousemove', this.findElement)
          workspaceStorage.trigger(event, elementId, tag, options)
          setTimeout(() => {
            this.iframeDocument.body.addEventListener('mousemove', this.findElement)
          }, 100)
        } else if (event === 'copy') {
          this.controls.hide()
          workspaceStorage.trigger(event, elementId, tag, options)
        } else if (event === 'hide') {
          this.controls.hide()
          workspaceStorage.trigger(event, elementId)
        } else {
          workspaceStorage.trigger(event, elementId, tag, options)
        }
      }
    }
  }

  /**
   * Interact with controls
   */
  interactWithControls () {
    // click on action
    this.controls.getControlsContainer().addEventListener('click',
      this.handleControlClick.bind(this, this.controls.getControlsContainer())
    )
    this.controls.getAppendControlContainer().addEventListener('click',
      this.handleControlClick.bind(this, this.controls.getAppendControlContainer())
    )
    // drag control
    this.controls.getControlsContainer().addEventListener('mousedown',
      (e) => {
        e && e.button === 0 && e.preventDefault()
        if (e.button === 0) {
          let path = this.getPath(e)
          // search for event
          let i = 0
          let el = null
          while (i < path.length && path[ i ] !== this.controls.getControlsContainer()) {
            if (path[ i ].dataset && path[ i ].dataset.vcDragHelper) {
              el = path[ i ]
              i = path.length
            }
            i++
          }
          if (el) {
            vcCake.setData('draggingElement', { id: el.dataset.vcDragHelper, point: { x: e.clientX, y: e.clientY } })
          }
        }
      }
    )

    // add controls interaction with content
    if (!this.hasOwnProperty('controlsPrevTarget')) {
      this.controlsPrevTarget = null
    }
    if (!this.hasOwnProperty('controlsPrevElement')) {
      this.controlsPrevElement = null
    }
    this.controls.getControlsContainer().addEventListener('mousemove', this.controlElementFind)
    this.controls.getControlsContainer().addEventListener('mouseleave', this.controlElementFind)
  }

  /**
   * Find element in controls (needed for controls interaction)
   * @param e
   */
  controlElementFind (e) {
    // need to run all events, so creating fake event
    if (!e) {
      e = {
        target: null
      }
    }
    if (e.target !== this.controlsPrevTarget) {
      this.controlsPrevTarget = e.target
      // get all vcv elements
      let path = this.getPath(e)
      // search for event
      let i = 0
      let element = null
      while (i < path.length && path[ i ] !== this.controls.getControlsContainer()) {
        // select handler for draw outline trigger
        if (path[ i ].dataset && path[ i ].dataset.vcvElementControls) {
          element = path[ i ].dataset.vcvElementControls
          i = path.length
        }
        i++
      }
      if (this.controlsPrevElement !== element) {
        // unset prev element
        if (this.controlsPrevElement) {
          // remove highlight from tree view
          /*
           this.api.request('editorContent:control:mouseLeave', {
           type: 'mouseLeave',
           vcElementId: this.controlsPrevElement
           })
           */
          layoutStorage.state('userInteractWith').set(this.controlsPrevElement)
          // hide outline from content element
          this.outline.hide()
        }
        // set new element
        if (element) {
          if (this.state.showOutline) {
            // highlight tree view
            layoutStorage.state('userInteractWith').set(element)
            /*
             this.api.request('editorContent:control:mouseEnter', {
             type: 'mouseEnter',
             vcElementId: element
             })
             */
            // show outline over content element
            let contentElement = this.iframeContainer.querySelector(`[data-vcv-element="${element}"]:not([data-vcv-interact-with-controls="false"])`)
            if (contentElement) {
              this.outline.show(contentElement, element)
            }
          }
        }

        this.controlsPrevElement = element
      }
    }
  }
}
