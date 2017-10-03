import _ from 'lodash'
export default class Helper {
  constructor (element, options) {
    Object.defineProperty(this, 'element', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: element
    })
    Object.defineProperty(this, 'options', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: _.defaults(options, {
        container: document.body
      })
    })
    Object.defineProperty(this, 'control', {
      enumerable: false,
      configurable: false,
      writable: true,
      value: this.draw()
    })
    this.hide()
  }

  draw () {
    const helperContainer = document.createElement('div')
    helperContainer.classList.add('vcv-ui-drag-helper-wrapper')

    let control = document.createElement('div')
    control.classList.add('vcv-drag-helper')
    control.classList.add('vcv-drag-helper-' + this.element.tag)
    if (this.element.containerFor() && this.element.containerFor().length) {
      control.classList.add('vcv-drag-helper-container')
    }
    helperContainer.appendChild(control)
    this.options.container.appendChild(helperContainer)
    let icon = this.element.options.iconLink

    if (icon) {
      control.innerHTML = '<img src="' +
        icon + '" class="vcv-ui-dnd-helper-icon" alt="" title=""/>'
    }

    let rect = control.getBoundingClientRect()
    control.style.marginTop = -rect.height / 2 + 'px'
    control.style.marginLeft = -rect.width / 2 + 'px'
    // prevent helper from showing when dropping from addElement panel
    control.style.top = '-100%'
    control.style.left = '-100%'
    return control
  }

  setPosition (point) {
    this.control.style.top = point.y + 'px'
    this.control.style.left = point.x + 'px'
  }

  hide () {
    this.control.style.display = 'none'
  }

  show () {
    this.control.style.display = 'flex'
  }

  remove () {
    let control = this.control
    this.control = null
    let controlParent = control.parentNode
    if (controlParent.classList.contains('vcv-ui-drag-helper-wrapper')) {
      controlParent.parentNode.removeChild(controlParent)
    } else {
      controlParent.removeChild(control)
    }
  }

  setOverTrash () {
    this.control.classList.add('vcv-drag-helper-over-trash')
  }

  removeOverTrash () {
    this.control.classList.remove('vcv-drag-helper-over-trash')
  }
}
