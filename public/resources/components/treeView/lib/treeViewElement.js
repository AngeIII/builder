import vcCake from 'vc-cake'
import React from 'react'
import classNames from 'classnames'
import MobileDetect from 'mobile-detect'
import PropTypes from 'prop-types'

const workspaceStorage = vcCake.getStorage('workspace')
const elementsStorage = vcCake.getStorage('elements')
const documentManger = vcCake.getService('document')
const utils = vcCake.getService('utils')
const cook = vcCake.getService('cook')
// const categoriesService = vcCake.getService('categories')
const hubCategoriesService = vcCake.getService('hubCategories')

export default class TreeViewElement extends React.Component {
  static propTypes = {
    showOutlineCallback: PropTypes.func,
    element: PropTypes.object.isRequired,
    data: PropTypes.oneOfType([ PropTypes.object, PropTypes.array ]),
    level: PropTypes.number,
    iframe: PropTypes.any,
    onMountCallback: PropTypes.func,
    onUnmountCallback: PropTypes.func,
    scrollValue: PropTypes.any,
    isAttribute: PropTypes.bool
  }

  static defaultProps = {
    iframe: document.getElementById('vcv-editor-iframe').contentWindow.document
  }

  adminBar = document.getElementById('wpadminbar')
  layoutBar = document.querySelector('.vcv-layout-bar')

  constructor (props) {
    super(props)

    const mobileDetect = new MobileDetect(window.navigator.userAgent)
    if (mobileDetect.mobile() && (mobileDetect.tablet() || mobileDetect.phone())) {
      this.isMobile = true
    }

    this.state = {
      childExpand: props.level > 1 || this.isMobile,
      hasBeenOpened: false,
      isActive: false,
      hasChild: false,
      showOutline: false,
      element: props.element,
      content: props.element.customHeaderTitle || props.element.name,
      editable: false,
      copyData: window.localStorage && (window.localStorage.getItem('vcv-copy-data') || workspaceStorage.state('copyData').get())
    }

    this.handleClick = this.handleClick.bind(this)
    this.handleMouseEnter = this.handleMouseEnter.bind(this)
    this.handleMouseLeave = this.handleMouseLeave.bind(this)
    this.handleOutline = this.handleOutline.bind(this)
    this.checkPaste = this.checkPaste.bind(this)
    this.dataUpdate = this.dataUpdate.bind(this)
    this.enableEditable = this.enableEditable.bind(this)
    this.validateContent = this.validateContent.bind(this)
    this.preventNewLine = this.preventNewLine.bind(this)
    this.clickHide = this.clickHide.bind(this)
    this.toggleControls = this.toggleControls.bind(this)
    this.checkTarget = this.checkTarget.bind(this)
  }

  dataUpdate (data) {
    this.setState({ element: data || this.props.element })
    if (data && data.hasOwnProperty('customHeaderTitle')) {
      let content = data.customHeaderTitle || data.name
      if (this.state.content !== content) {
        this.setState({
          content
        }, () => {
          if (this.span) {
            this.span.innerText = content
          }
        })
      }
    }
  }

  componentWillReceiveProps (nextProps) {
    const newShowOutline = nextProps.showOutlineCallback(nextProps.element.id)
    newShowOutline !== this.state.showOutline && this.setState({ showOutline: newShowOutline })
    this.dataUpdate(nextProps.element)
  }

  componentDidMount () {
    elementsStorage.on(`element:${this.state.element.id}`, this.dataUpdate)

    this.props.onMountCallback(this.state.element.id)
    workspaceStorage.state('copyData').onChange(this.checkPaste)
  }

  componentWillUnmount () {
    elementsStorage.off(`element:${this.state.element.id}`, this.dataUpdate)
    this.props.onUnmountCallback(this.state.element.id)
    workspaceStorage.state('copyData').ignoreChange(this.checkPaste)
    workspaceStorage.state('userInteractWith').set(false)
  }

  checkPaste (data) {
    if (data && data.element) {
      this.setState({
        copyData: data
      })
    }
  }

  handleOutline (outlineElementId) {
    let showOutline = outlineElementId === this.props.element.id
    if (this.state.showOutline !== showOutline) {
      this.setState({
        showOutline: showOutline
      })
    }
  }

  clickChildExpand = () => {
    this.setState({
      childExpand: !this.state.childExpand,
      hasBeenOpened: true
    })
  }

  clickAddChild (tag) {
    workspaceStorage.trigger('add', this.state.element.id, tag)
  }

  clickClone = (e) => {
    e && e.preventDefault()
    workspaceStorage.trigger('clone', this.state.element.id)
  }

  clickCopy = (e) => {
    e && e.preventDefault()
    workspaceStorage.trigger('copy', this.state.element.id)
  }

  clickPaste = (e) => {
    e && e.preventDefault()
    workspaceStorage.trigger('paste', this.state.element.id)
  }

  clickPasteAfter = (e) => {
    e && e.preventDefault()
    workspaceStorage.trigger('pasteAfter', this.state.element.id)
  }

  clickEdit = (tab = '') => {
    let settings = workspaceStorage.state('settings').get()
    if (settings && settings.action === 'edit') {
      workspaceStorage.state('settings').set(false)
    }
    const options = {}
    if (this.props.isAttribute) {
      const parentElement = documentManger.get(this.state.element.parent)
      options.child = true
      options.parentElement = parentElement
      options.parentElementOptions = {}
    }
    workspaceStorage.trigger('edit', this.state.element.id, tab, options)
  }

  clickDelete = (e) => {
    e && e.preventDefault()
    workspaceStorage.trigger('remove', this.state.element.id)
  }

  clickHide () {
    workspaceStorage.trigger('hide', this.state.element.id)
  }

  getContent (children) {
    const { hasBeenOpened, childExpand } = this.state
    if (!childExpand && !hasBeenOpened && !this.isMobile) {
      return null
    }
    const { showOutlineCallback, onMountCallback, onUnmountCallback } = this.props
    const level = this.props.level + 1
    let elementsList = children.map((element) => {
      return <TreeViewElement
        showOutlineCallback={showOutlineCallback}
        onMountCallback={onMountCallback}
        onUnmountCallback={onUnmountCallback}
        element={element}
        key={element.id}
        level={level}
        scrollValue={this.props.scrollValue} />
    }, this)
    return elementsList.length ? <ul className='vcv-ui-tree-layout-node'>{elementsList}</ul> : ''
  }

  /**
   * Perform scroll to element inside iframe
   * @param e
   */
  scrollToElementInsideFrame (e) {
    const elId = e.currentTarget.parentNode.dataset.vcvElement
    const editorEl = this.props.iframe.querySelector(`#el-${elId}`)
    if (!editorEl) {
      return
    }
    const elRect = editorEl.getBoundingClientRect()
    const wh = document.getElementById('vcv-editor-iframe').contentWindow.innerHeight
    const below = elRect.bottom > wh && elRect.top > wh
    const above = elRect.bottom < 0 && elRect.top < 0

    if (above || below) {
      editorEl.scrollIntoView({ behavior: 'smooth' })
    }
  }

  /**
   * Perform scroll to element inside current document
   * @param e
   */
  scrollToElementInsideCurrentDocument (e) {
    const { scrollValue } = this.props
    const elId = e.currentTarget.parentNode.dataset.vcvElement
    const editorEl = document.getElementById(`el-${elId}-temp`)
    if (!editorEl) {
      return
    }
    const elRect = editorEl.getBoundingClientRect()
    const isFixed = window.getComputedStyle(this.layoutBar).position === 'fixed'
    const wh = window.innerHeight
    const below = elRect.bottom > wh && elRect.top > wh
    const above = isFixed ? elRect.bottom < this.layoutBar.getBoundingClientRect().bottom : elRect.bottom < 0 && elRect.top < 0

    if (above || below) {
      const barHeight = typeof scrollValue === 'function' ? scrollValue(this.layoutBar, this.adminBar) : scrollValue
      const curPos = window.pageYOffset
      const yPos = curPos + elRect.top - barHeight
      window.scrollTo(0, yPos)
    }
  }

  /**
   * Execute click handle on treeView element based on scrollValue prop
   * @param e
   */
  handleClick (e) {
    if (!this.props.scrollValue) {
      this.scrollToElementInsideFrame(e)
    } else {
      this.scrollToElementInsideCurrentDocument(e)
    }
  }

  handleMouseEnter (e) {
    if (e.currentTarget.parentNode.dataset && e.currentTarget.parentNode.dataset.hasOwnProperty('vcvElement')) {
      workspaceStorage.state('userInteractWith').set(this.state.element.id)
    }
  }

  handleMouseLeave (e) {
    if (e.currentTarget.parentNode.dataset && e.currentTarget.parentNode.dataset.hasOwnProperty('vcvElement')) {
      workspaceStorage.state('userInteractWith').set(false)
    }
  }

  enableEditable () {
    this.setState({
      editable: true
    }, () => {
      this.span && this.span.focus()
    })
  }

  updateContent (value) {
    let element = cook.get(this.props.element)
    element.set('customHeaderTitle', value)
    let elementData = element.toJS()
    elementsStorage.trigger('update', elementData.id, elementData, 'editForm')
    this.setState({
      content: value || element.get('name'),
      editable: false
    }, () => {
      if (!value && this.span) {
        this.span.innerText = element.get('name')
      }
    })
  }

  validateContent () {
    let value = this.span && this.span.innerText.trim()
    if (value) {
      this.updateContent(value)
    }
  }

  preventNewLine (event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.nativeEvent.stopImmediatePropagation()
      event.stopPropagation()
      this.span && this.span.blur()
      this.validateContent()
    }
  }

  checkTarget (e) {
    if (e && e.target && this.controlsContent && !(this.controlsContent.contains(e.target) || this.controlsTrigger.contains(e.target))) {
      this.toggleControls()
    }
  }

  toggleControls () {
    let fn = this.state.showControls ? 'removeEventListener' : 'addEventListener'
    window[ fn ] && window[ fn ]('touchstart', this.checkTarget)
    this.setState({
      showControls: !this.state.showControls
    })
  }

  getPasteOptions (copyData, pasteEl) {
    let pasteOptions = {
      disabled: !copyData,
      pasteAfter: false
    }

    if (!copyData) {
      return pasteOptions
    }

    if (copyData.constructor === String) {
      try {
        copyData = JSON.parse(copyData)
      } catch (err) {
        console.error(err)
        return pasteOptions
      }
    }

    const copiedEl = copyData && copyData.element && copyData.element.element
    const copiedElCook = copiedEl && cook.get(copiedEl)
    const copiedElRelatedTo = copiedElCook.get('relatedTo')
    const copiedElRelatedToValue = copiedElRelatedTo && copiedElRelatedTo.value

    const pasteElCook = pasteEl && cook.get(pasteEl)
    const pasteElContainerFor = pasteElCook.get('containerFor')
    const pasteElContainerForValue = pasteElContainerFor && pasteElContainerFor.value

    if (
      copiedElRelatedToValue &&
      pasteElContainerForValue &&
      copiedElRelatedToValue.length &&
      pasteElContainerForValue.length
    ) {
      if (pasteElContainerForValue.indexOf('General') < 0 || copiedElRelatedToValue.indexOf('General') < 0) {
        pasteOptions.disabled = true

        pasteElContainerForValue.forEach((item) => {
          if (copiedElRelatedToValue.indexOf(item) >= 0) {
            pasteOptions.disabled = false
          }
        })
      }

      if (pasteOptions.disabled && pasteElContainerForValue.indexOf('General') < 0) {
        if (pasteElCook.get('tag') === copiedElCook.get('tag')) {
          pasteOptions.disabled = false
          pasteOptions.pasteAfter = true
        }
      }
    }

    return pasteOptions
  }

  render () {
    const hidden = this.state.element.hidden
    const localizations = window.VCV_I18N ? window.VCV_I18N() : false
    const addText = localizations ? localizations.add : 'Add'
    const addElementText = localizations ? localizations.addElement : 'Add Element'
    const cloneText = localizations ? localizations.clone : 'Clone'
    const copyText = localizations ? localizations.copy : 'Copy'
    const pasteText = localizations ? localizations.paste : 'Paste'
    const pasteAfterText = localizations ? localizations.pasteAfter : 'Paste After'
    const removeText = localizations ? localizations.remove : 'Remove'
    const editText = localizations ? localizations.edit : 'Edit'
    let visibilityText = ''
    if (hidden) {
      visibilityText = localizations ? localizations.hideOn : 'Hide: On'
    } else {
      visibilityText = localizations ? localizations.hideOff : 'Hide: Off'
    }
    const rowLayoutText = localizations ? localizations.rowLayout : 'Row Layout'

    let { editable, content, copyData } = this.state

    let element = cook.get(this.props.element)
    if (!element) {
      return null
    }
    let treeChildClasses = classNames({
      'vcv-ui-tree-layout-node-child': true,
      'vcv-ui-tree-layout-node-expand': this.state.childExpand,
      'vcv-ui-tree-layout-node-state-draft': false,
      'vcv-ui-tree-layout-node-hidden': hidden
    })

    let treeChildProps = {}
    treeChildProps['data-vcv-dnd-element-expand-status'] = this.state.childExpand ? 'opened' : 'closed'

    let innerChildren = documentManger.children(this.state.element.id)
    let childHtml = this.getContent(innerChildren)
    this.state.hasChild = !!innerChildren.length

    let addChildControl = false
    let editRowLayoutControl = false
    const elementContainerFor = element.containerFor()
    if (elementContainerFor.length) {
      let title = addElementText
      let addElementTag = ''
      let children = cook.getChildren(element.get('tag'))
      if (children.length === 1) {
        let child = cook.get(children[ 0 ])
        title = `${addText} ${child.get('name')}`
        addElementTag = child.get('tag')
      }
      addChildControl = (
        <span
          className='vcv-ui-tree-layout-control-action'
          title={title}
          onClick={this.clickAddChild.bind(this, addElementTag)}
        >
          <i className='vcv-ui-icon vcv-ui-icon-add-thin' />
        </span>
      )
      if (this.props.element.tag === 'row') {
        editRowLayoutControl = (
          <span
            className='vcv-ui-tree-layout-control-action'
            title={rowLayoutText}
            onClick={this.clickEdit.bind(this, 'layout')}
          >
            <i className='vcv-ui-icon vcv-ui-icon-row-layout' />
          </span>
        )
      }
    }

    let expandTrigger = ''
    if (this.state.hasChild) {
      expandTrigger = (
        <i className='vcv-ui-tree-layout-node-expand-trigger vcv-ui-icon vcv-ui-icon-expand'
          onClick={this.clickChildExpand} />
      )
    }

    let visibilityControl = ''
    if (this.props.element.tag !== 'column') {
      let iconClasses = classNames({
        'vcv-ui-icon': true,
        'vcv-ui-icon-eye-on': !hidden,
        'vcv-ui-icon-eye-off': hidden
      })
      visibilityControl = (
        <span className='vcv-ui-tree-layout-control-action' title={visibilityText} onClick={this.clickHide}>
          <i className={iconClasses} />
        </span>
      )
    }

    let pasteControl = false

    let copyControl = (
      <span
        className='vcv-ui-tree-layout-control-action'
        title={copyText}
        onClick={this.clickCopy.bind(this)}
      >
        <i className='vcv-ui-icon vcv-ui-icon-copy-icon' />
      </span>
    )

    // paste action
    const pasteElCook = this.state.element && cook.get(this.state.element)
    const pasteElContainerFor = pasteElCook && pasteElCook.get('containerFor')
    const isPasteAvailable = pasteElContainerFor && pasteElContainerFor.value && pasteElContainerFor.value.length

    if (isPasteAvailable) {
      let pasteOptions = this.getPasteOptions(copyData, this.state.element)

      let attrs = {}

      if (pasteOptions.disabled) {
        attrs.disabled = true
      }

      if (!attrs.disabled) {
        attrs.onClick = pasteOptions.pasteAfter ? this.clickPasteAfter.bind(this) : this.clickPaste.bind(this)
      }

      pasteControl = (
        <span
          className='vcv-ui-tree-layout-control-action'
          title={pasteOptions.pasteAfter ? pasteAfterText : pasteText}
          {...attrs}
        >
          <i className='vcv-ui-icon vcv-ui-icon-paste-icon' />
        </span>
      )
    }

    let childControls = <span className='vcv-ui-tree-layout-control-actions'>
      {addChildControl}
      {editRowLayoutControl}
      <span className='vcv-ui-tree-layout-control-action' title={editText} onClick={this.clickEdit.bind(this, '')}>
        <i className='vcv-ui-icon vcv-ui-icon-edit' />
      </span>
      <span className='vcv-ui-tree-layout-control-action' title={cloneText} onClick={this.clickClone}>
        <i className='vcv-ui-icon vcv-ui-icon-copy' />
      </span>
      {visibilityControl}
      {copyControl}
      {pasteControl}
      <span className='vcv-ui-tree-layout-control-action' title={removeText} onClick={this.clickDelete}>
        <i className='vcv-ui-icon vcv-ui-icon-trash' />
      </span>
    </span>

    let controlClasses = classNames({
      'vcv-ui-tree-layout-control': true,
      'vcv-ui-state--active': this.state.isActive,
      'vcv-ui-state--outline': this.state.showOutline,
      'vcv-ui-tree-layout-control-mobile': this.isMobile
    })

    let publicPath = hubCategoriesService.getElementIcon(element.get('tag'))
    let space = 0.8
    let defaultSpace = utils.isRTL() ? 2 : 1

    if (!content) {
      content = element.get('name')
    }

    let controlLabelClasses = 'vcv-ui-tree-layout-control-label'
    if (editable) {
      controlLabelClasses += ' vcv-ui-tree-layout-control-label-editable'
    }

    let dragHelperClasses = 'vcv-ui-tree-layout-control-drag-handler vcv-ui-drag-handler'
    if (this.isMobile) {
      dragHelperClasses += ' vcv-ui-tree-layout-control-drag-handler-mobile'
    }

    const controlPadding = (space * this.props.level + defaultSpace) + 'rem'
    let controlStyle = utils.isRTL() ? { paddingRight: controlPadding } : { paddingLeft: controlPadding }

    if (this.isMobile) {
      let controlsContent = this.state.showControls ? (
        <div ref={controlsContent => { this.controlsContent = controlsContent }}
          className='vcv-ui-tree-layout-controls-content'>
          {childControls}
        </div>
      ) : null

      return (
        <li
          className={treeChildClasses}
          data-vcv-element={this.props.element.id}
          type={element.get('type')}
          name={element.get('name')}
          {...treeChildProps}
        >
          <div className={controlClasses}>
            <div className='vcv-ui-tree-layout-control-content'>
              <div className={dragHelperClasses} style={controlStyle}>
                <i className='vcv-ui-tree-layout-control-icon'><img src={publicPath} className='vcv-ui-icon'
                  alt='' /></i>
                <span className='vcv-ui-tree-layout-control-label'>
                  <span>{content}</span>
                </span>
              </div>
              <div
                className='vcv-ui-tree-layout-controls-trigger'
                onClick={this.toggleControls}
                ref={controlsTrigger => { this.controlsTrigger = controlsTrigger }}
              >
                <i className='vcv-ui-icon vcv-ui-icon-mobile-menu' />
              </div>
              {controlsContent}
            </div>
          </div>
          {childHtml}
        </li>
      )
    }

    return (
      <li
        className={treeChildClasses}
        data-vcv-element={this.props.element.id}
        type={element.get('type')}
        name={element.get('name')}
        {...treeChildProps}
      >
        <div
          className={controlClasses}
          style={controlStyle}
          onMouseOver={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
          onClick={this.handleClick}
        >
          <div className={dragHelperClasses}>
            <i className='vcv-ui-drag-handler-icon vcv-ui-icon vcv-ui-icon-drag-dots' />
          </div>
          <div className='vcv-ui-tree-layout-control-content'>
            {expandTrigger}
            <i className='vcv-ui-tree-layout-control-icon'><img src={publicPath} className='vcv-ui-icon' alt='' /></i>
            <span className={controlLabelClasses}>
              <span ref={span => { this.span = span }}
                contentEditable={editable}
                suppressContentEditableWarning
                onClick={this.enableEditable}
                onKeyDown={this.preventNewLine}
                onBlur={this.validateContent}>
                {content}
              </span>
            </span>
            {childControls}
          </div>
        </div>
        {childHtml}
      </li>
    )
  }
}
