import React from 'react'
import ReactDOM from 'react-dom'
import MediumEditor from 'medium-editor'
import vcCake from 'vc-cake'
import $ from 'jquery'
import striptags from 'striptags'

const documentManager = vcCake.getService('document')
const cook = vcCake.getService('cook')
const dataProcessor = vcCake.getService('dataProcessor')
const elementsStorage = vcCake.getStorage('elements')
const wordpressDataStorage = vcCake.getStorage('wordpressData')
const shortcodesAssetsStorage = vcCake.getStorage('shortcodeAssets')

export default class ContentEditableComponent extends React.Component {
  static spinnerHTML = '<span class="vcv-ui-content-editable-helper-loader vcv-ui-wp-spinner"></span>'

  static propTypes = {
    api: React.PropTypes.object.isRequired,
    id: React.PropTypes.string.isRequired,
    field: React.PropTypes.string.isRequired,
    fieldType: React.PropTypes.string.isRequired,
    children: React.PropTypes.oneOfType([
      React.PropTypes.arrayOf(React.PropTypes.node),
      React.PropTypes.node,
      React.PropTypes.string
    ]),
    className: React.PropTypes.string,
    options: React.PropTypes.object
  }

  constructor (props) {
    super(props)
    this.iframe = document.querySelector('#vcv-editor-iframe')
    this.layoutHeader = document.querySelector('#vcv-layout-header')
    this.iframeWindow = this.iframe && this.iframe.contentWindow
    this.iframeDocument = this.iframeWindow && this.iframeWindow.document
    this.state = {
      contentEditable: false,
      trackMouse: false,
      html: ContentEditableComponent.spinnerHTML,
      realContent: this.props.children,
      mouse: null,
      overlayTimeout: null
    }
    this.handleLayoutModeChange = this.handleLayoutModeChange.bind(this)
    this.handleGlobalClick = this.handleGlobalClick.bind(this)
    this.handleLayoutCustomModeChange = this.handleLayoutCustomModeChange.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseMove = this.handleMouseMove.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
  }

  componentDidMount () {
    const dom = ReactDOM.findDOMNode(this)
    let editorSettings = {
      delay: 1000,
      toolbar: { buttons: [ 'bold', 'italic', 'underline' ] },
      imageDragging: false,
      paste: {
        cleanPastedHTML: false,
        cleanAttrs: [ 'style', 'dir' ],
        cleanTags: [ 'label', 'meta' ],
        unwrapTags: [ 'sub', 'sup' ],
        forcePlainText: false
      },
      contentWindow: this.iframeWindow,
      ownerDocument: this.iframeDocument,
      elementsContainer: this.iframeDocument.body
    }
    if (this.props.options && this.props.options.inlineMode === 'text') {
      editorSettings.toolbar = false
      editorSettings.keyboardCommands = {
        commands: [
          {
            command: function () {},
            key: 'B',
            meta: true,
            shift: false,
            alt: false
          }, {
            command: function () {},
            key: 'I',
            meta: true,
            shift: false,
            alt: false
          }, {
            command: function () {},
            key: 'U',
            meta: true,
            shift: false,
            alt: false
          }
        ]
      }
      editorSettings.disableReturn = true
      editorSettings.paste = {
        forcePlainText: false,
        leanPastedHTML: true
      }
    }

    this.medium = new MediumEditor(dom, editorSettings)
    this.medium.destroy()
    this.updateHtmlWithServer(this.props.children)
    vcCake.onDataChange('vcv:layoutCustomMode', this.handleLayoutCustomModeChange)
  }

  updateInlineData () {
    const { html } = this.state
    if (!html) {
      return
    }
    const helper = ReactDOM.findDOMNode(this)
    helper.innerHTML = ''
    let range = document.createRange()
    let documentFragment = range.createContextualFragment(html)
    helper.appendChild(documentFragment)
  }

  componentWillUnmount () {
    if (this.state.contentEditable) {
      this.iframeWindow.removeEventListener('click', this.handleGlobalClick)
      this.layoutHeader.removeEventListener('click', this.handleGlobalClick)
      this.medium.destroy()
      this.removeOverlay()
    }
    vcCake.ignoreDataChange('vcv:layoutCustomMode', this.handleLayoutCustomModeChange)
    vcCake.setData('vcv:layoutCustomMode', null)
  }

  componentWillReceiveProps (nextProps) {
    if (this.state.contentEditable !== true && nextProps.children !== this.state.realContent) {
      this.setState({ realContent: nextProps.children })
      this.updateHtmlWithServer(nextProps.children)
    }
  }

  /**
   * Hide inline editor, save changes
   * @param data
   */
  handleLayoutCustomModeChange (data) {
    if (this.state.contentEditable && data !== 'contentEditable') {
      this.handleLayoutModeChange(null)
      this.updateHtmlWithServer(this.state.realContent)
    }
  }

  handleLayoutModeChange (mode) {
    mode !== 'dnd' && this.setState({ contentEditable: mode === 'contentEditable', trackMouse: false })
    if (mode !== 'contentEditable') {
      this.iframeWindow.removeEventListener('click', this.handleGlobalClick)
      this.layoutHeader.removeEventListener('click', this.handleGlobalClick)
      this.medium.destroy()
      this.removeOverlay()
      // Save data to map to undo/Redo
      const data = documentManager.get(this.props.id)
      const element = cook.get(data)
      let contentToSave = this.props.options && this.props.options.inlineMode === 'text'
        ? striptags(this.state.realContent) : this.state.realContent
      element.set(this.props.field, contentToSave)
      elementsStorage.trigger('update', element.get('id'), element.toJS())
      // this.props.api.request('data:update', element.get('id'), element.toJS())
    }
    // add overlay
    if (this.state.contentEditable) {
      this.drawOverlay()
    }
  }

  drawOverlay () {
    let elementOverlay = this.iframeDocument.querySelector('#vcv-ui-content-overlay')
    if (!elementOverlay) {
      elementOverlay = this.iframeDocument.createElementNS('http://www.w3.org/2000/svg', 'svg')
      elementOverlay.id = 'vcv-ui-content-overlay'
      elementOverlay.classList.add('vcv-ui-content-overlay-container')
      // todo: remove styles from js
      let styles = {
        position: 'fixed',
        top: 0,
        left: 0,
        opacity: 0,
        transition: 'opacity .2s ease-in-out',
        pointerEvents: 'none',
        zIndex: 1900
      }
      for (let prop in styles) {
        elementOverlay.style[ prop ] = styles[ prop ]
      }
      this.iframeDocument.body.appendChild(elementOverlay)
    }

    let overlay = elementOverlay.querySelector('.vcv-ui-content-overlay')
    if (!overlay) {
      overlay = this.iframeDocument.createElementNS('http://www.w3.org/2000/svg', 'path')
      overlay.classList.add('vcv-ui-content-overlay')
      overlay.setAttribute('fill', 'rgba(0, 0, 0, .6)')
      overlay.setAttribute('fill-rule', 'evenodd')
      // todo: remove styles from js
      let styles = {
        pointerEvents: 'all'
      }
      for (let prop in styles) {
        overlay.style[ prop ] = styles[ prop ]
      }
      elementOverlay.appendChild(overlay)
    }

    let overlayShadow = this.iframeDocument.querySelector('#vcv-ui-content-overlay-shadow')
    if (!overlayShadow) {
      overlayShadow = this.iframeDocument.createElement('div')
      overlayShadow.id = 'vcv-ui-content-overlay-shadow'
      overlayShadow.classList.add('vcv-ui-content-overlay-shadow')
      // todo: remove styles from js
      let styles = {
        pointerEvents: 'none',
        boxShadow: 'rgba(0, 0, 0, 0.3) 1px 0 10px 0',
        position: 'fixed'
      }
      for (let prop in styles) {
        overlayShadow.style[ prop ] = styles[ prop ]
      }
      this.iframeDocument.body.appendChild(overlayShadow)
    }

    let data = {
      domElement: ReactDOM.findDOMNode(this),
      overlayContainer: elementOverlay,
      overlay: overlay,
      overlayShadow: overlayShadow
    }
    this.autoUpdateOverlayPosition(data)
  }

  removeOverlay () {
    console.log(elementOverlay, 'removeOverlay')
    this.stopAutoUpdateOverlayPosition()
    let elementOverlay = this.iframeDocument.querySelector('#vcv-ui-content-overlay')
    if (elementOverlay) {
      elementOverlay.addEventListener('transitionend', clearAfterTransition.bind(this))
      elementOverlay.style.opacity = 0
    }
    function clearAfterTransition () {
      let elementOverlay = this.iframeDocument.querySelector('#vcv-ui-content-overlay')
      if (elementOverlay) {
        elementOverlay.removeEventListener('transitionend', clearAfterTransition.bind(this))
        elementOverlay.parentNode.removeChild(elementOverlay)
      }
      let elementOverlayShadow = this.iframeDocument.querySelector('#vcv-ui-content-overlay-shadow')
      if (elementOverlayShadow) {
        elementOverlayShadow.parentNode.removeChild(elementOverlayShadow)
      }
    }
  }

  updateOverlayPosition (data) {
    let paddingSize = {
      horizontal: 15,
      vertical: 5
    }
    let domElement = data.domElement
    let overlayContainer = data.overlayContainer
    let overlay = data.overlay
    let overlayShadow = data.overlayShadow

    // set main svg width and height
    overlayContainer.style.width = `${this.iframeWindow.innerWidth}px`
    overlayContainer.style.height = `${this.iframeWindow.innerHeight}px`

    // draw overlay for svg
    let containerSize = `M 0 0 H ${this.iframeWindow.innerWidth} V ${this.iframeWindow.innerHeight} H 0 V 0`
    let elementPos = domElement.getBoundingClientRect()
    let elPos = {
      x: Math.ceil(elementPos.left - paddingSize.horizontal),
      y: Math.ceil(elementPos.top - paddingSize.vertical),
      width: Math.floor(elementPos.width + paddingSize.horizontal * 2),
      height: Math.floor(elementPos.height + paddingSize.vertical * 2)
    }
    let elementSize = `M ${elPos.x} ${elPos.y} h ${elPos.width} v ${elPos.height} h -${elPos.width} z`
    overlay.setAttribute('d', `${containerSize} ${elementSize}`)

    let shadowSize = {
      left: elPos.x,
      top: elPos.y,
      width: elPos.width,
      height: elPos.height
    }
    for (let prop in shadowSize) {
      overlayShadow.style[ prop ] = shadowSize[ prop ] + 'px'
    }
  }

  /**
   * Automatically update controls container position after timeout
   * @param data
   */
  autoUpdateOverlayPosition (data) {
    this.stopAutoUpdateOverlayPosition()
    if (!this.state.overlayTimeout) {
      this.updateOverlayPosition(data)
      data.overlayContainer.style.opacity = 1
      this.setState({
        overlayTimeout: this.iframeWindow.setInterval(this.updateOverlayPosition.bind(this, data), 16)
      })
    }
  }

  /**
   * Stop automatically update controls container position and clear timeout
   */
  stopAutoUpdateOverlayPosition () {
    if (this.state.overlayTimeout) {
      this.iframeWindow.clearInterval(this.state.overlayTimeout)
      this.setState({
        overlayTimeout: null
      })
    }
  }

  getShortcodesRegexp () {
    return new RegExp('\\[(\\[?)([\\w|-]+\\b)(?![\\w-])([^\\]\\/]*(?:\\/(?!\\])[^\\]\\/]*)*?)(?:(\\/)\\]|\\](?:([^\\[]*(?:\\[(?!\\/\\2\\])[^\\[]*)*)(\\[\\/\\2\\]))?)(\\]?)')
  }

  mediumSetup () {
    this.medium.setup()
    this.medium.subscribe('editableInput', () => {
      this.updateElementData()
      if (this.mediumSelection) {
        this.medium.importSelection(this.mediumSelection)
        this.mediumSelection = undefined
      }
    })
    this.mediumSelection = this.medium.exportSelection()
  }

  updateHtmlWithServer (content) {
    if (content.match(this.getShortcodesRegexp())) {
      this.setState({ html: ContentEditableComponent.spinnerHTML })
      dataProcessor.appServerRequest({
        'vcv-action': 'elements:ajaxShortcode:adminNonce',
        'vcv-shortcode-string': content,
        'vcv-nonce': window.vcvNonce,
        'vcv-source-id': window.vcvSourceID
      }).then((data) => {
        let scriptDom = window.jQuery('<div>' + data + '</div>').find('[data="vcv-files"]').get(0)
        if (scriptDom) {
          let assetFiles = window.jQuery('<div>' + decodeURIComponent(scriptDom.innerHTML) + '</div>')
          shortcodesAssetsStorage.trigger('add', {
            cssBundles: assetFiles.find('link[href], style'),
            jsBundles: assetFiles.find('script')
          })
        }
        this.setState({ html: data }, () => {
          this.updateInlineData()
        })
      })
    } else {
      this.setState({ html: content })
    }
  }

  updateElementData () {
    const dom = ReactDOM.findDOMNode(this)
    let content = dom.innerHTML
    this.setState({ realContent: content })
    wordpressDataStorage.state('status').set({ status: 'changed' })
  }

  handleChange () {
    this.updateElementData()
  }

  handleGlobalClick (e) {
    const $target = $(e.target)
    if (!$target.is('[data-vcv-element="' + this.props.id + '"]') && !$target.parents('[data-vcv-element="' + this.props.id + '"]').length) {
      this.medium.destroy()
      if (vcCake.getData('vcv:layoutCustomMode') !== null) {
        vcCake.setData('vcv:layoutCustomMode', null)
        window.setTimeout(() => {
          this.handleLayoutModeChange(null)
        }, 0)
      }
      this.updateHtmlWithServer(this.state.realContent)
    }
  }

  handleMouseMove () {
    if (this.state.trackMouse === true) {
      this.setState({ trackMouse: false, contentEditable: false })
      this.medium.destroy()
    }
  }

  handleMouseDown () {
    if (this.state.trackMouse === false && this.state.contentEditable === false) {
      this.setState({ trackMouse: true, contentEditable: true })
    }
  }

  handleMouseUp () {
    if (this.state.trackMouse === true) {
      this.mediumSetup()
      if (vcCake.getData('vcv:layoutCustomMode') !== 'contentEditable') {
        vcCake.setData('vcv:layoutCustomMode', 'contentEditable')
        this.handleLayoutModeChange('contentEditable')
      }
      this.iframeWindow.addEventListener('click', this.handleGlobalClick)
      this.layoutHeader.addEventListener('click', this.handleGlobalClick)
      this.setState({ html: this.state.realContent })
    }
  }

  render () {
    const props = {
      dangerouslySetInnerHTML: { __html: this.state.html },
      className: this.props.className,
      contentEditable: this.state.contentEditable,
      onMouseDown: this.handleMouseDown,
      onMouseMove: this.handleMouseMove,
      onMouseUp: this.handleMouseUp,
      'data-vcvs-html': this.state.realContent,
      'data-vcv-content-editable-inline-mode': this.props.options.inlineMode || 'html'
    }
    if (this.mediumSelection) {
      window.setTimeout(() => {
        this.medium && this.medium.importSelection(this.mediumSelection)
        this.mediumSelection = undefined
      }, 0)
    }
    return React.createElement('vcvhelper', props)
  }
}
