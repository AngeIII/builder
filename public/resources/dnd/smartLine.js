const _ = require('lodash')
/**
 * From to highlight position
 * @constructor
 */
const SmartLine = function (options) {
  Object.defineProperty(this, 'options', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: _.defaults(options, {
      document: document,
      container: document.body
    })
  })
  this.create()
}

SmartLine.prototype.create = function () {
  const oldSmartLine = this.options.container.querySelector('#vcv-ui-smart-line-container')
  if (oldSmartLine) {
    this.options.container.removeChild(oldSmartLine)
  }
  this.elContainer = document.createElement('div')
  this.elContainer.classList.add('vcv-ui-smart-line-container')
  this.elContainer.id = 'vcv-ui-smart-line-container'
  this.el = document.createElement('svg')
  this.el.id = 'vcv-dnd-smart-line'
  this.currentElement = null
  this.prevElement = null
  this.point = { x: 0, y: 0 }
  this.elContainer.appendChild(this.el)
  this.options.container.appendChild(this.elContainer)
}
SmartLine.prototype.setPoint = function (x, y) {
  this.point.x = x
  this.point.y = y
}
SmartLine.prototype.remove = function () {
  this.options.container.removeChild(this.elContainer)
  this.prevElement = null
}
SmartLine.prototype.setCurrentElement = function (element) {
  this.currentElement = element
}
SmartLine.prototype.isSameElementPosition = function (point, element) {
  return this.point.x === point.x && this.point.y === point.y && element === this.prevElement
}
SmartLine.prototype.setStyle = function (point, width, height, frame) {
  this.el.setAttribute('style', _.reduce({
    width: width,
    height: height,
    top: point.y - point.top,
    left: point.x - point.left
  }, function (result, value, key) {
    return result + key + ':' + value + 'px;'
  }, ''))
  frame && this.el.classList.add('vcv-dnd-smart-line-frame')
}
SmartLine.prototype.clearStyle = function () {
  this.el.classList.remove('vcv-dnd-smart-line-frame', 'vcv-is-shown')
  this.el && this.el.classList.remove('vcv-smart-line-transition')
}
SmartLine.prototype.getVcvIdFromElement = function (element) {
  return element.dataset.vcvDndElement || null
}
SmartLine.prototype.redraw = function (element, point, settings, parents = []) {
  let position = false
  let $element = window.jQuery(element)
  let defaultLiteSize = 2
  let lineWidth = defaultLiteSize
  let lineHeight = defaultLiteSize
  let linePoint = { x: 0, y: 0 }
  let frame = false
  let isVerticalLine
  settings = _.defaults(settings || {}, {
    allowAppend: true,
    allowBeforeAfter: true
  })
  let rect = element.getBoundingClientRect()
  let positionY = point.y - (rect.top + rect.height / 2)
  let positionX = point.x - (rect.left + rect.width / 2)

  if (settings.allowAppend === true) {
    position = 'append'
  } else if (settings.allowBeforeAfter === true && Math.abs(positionX) / rect.width > Math.abs(positionY) / rect.height) {
    position = positionX > 0 ? 'after' : 'before'
  } else if (settings.allowBeforeAfter === true) {
    position = positionY > 0 ? 'after' : 'before'
  }

  if (position === 'append') {
    linePoint.x = rect.left
    linePoint.y = rect.top
    lineWidth = rect.width
    lineHeight = rect.height
    frame = true
  } else {
    let prevElement = $element.prevAll('[data-vcv-dnd-element]:not([data-vcv-dnd-helper="true"])').get(0)
    let nextElement = $element.nextAll('[data-vcv-dnd-element]').get(0)
    let prevRect = prevElement ? prevElement.getBoundingClientRect() : null
    let nextRect = nextElement ? nextElement.getBoundingClientRect() : null
    // show vertical line in layout only
    if (!$element.closest('.vcv-ui-tree-layout').get(0)) {
      isVerticalLine = (prevRect && prevRect.left !== rect.left) || (nextRect && nextRect.left !== rect.left)
    }
    // set default line position
    linePoint.x = rect.left
    linePoint.y = position === 'before' ? rect.top : rect.bottom
    linePoint.y -= defaultLiteSize / 2
    lineWidth = rect.width

    // set vertical line position
    if (isVerticalLine) {
      lineWidth = defaultLiteSize
      lineHeight = rect.height
      linePoint.y = rect.top
      linePoint.x = position === 'before' ? rect.left : rect.right
      linePoint.x -= defaultLiteSize / 2
    }

    // modify line position for margins
    if (position === 'before' && prevRect) {
      if (isVerticalLine) {
        let positionModificator = (rect.left - prevRect.right) / 2
        positionModificator = positionModificator > 0 ? positionModificator : 0
        linePoint.x -= positionModificator
      } else {
        let positionModificator = (rect.top - prevRect.bottom) / 2
        positionModificator = positionModificator > 0 ? positionModificator : 0
        linePoint.y -= positionModificator
      }
    }
    if (position === 'after' && nextRect) {
      if (isVerticalLine) {
        let positionModificator = (nextRect.left - rect.right) / 2
        positionModificator = positionModificator > 0 ? positionModificator : 0
        linePoint.x += positionModificator
      } else {
        let positionModificator = (nextRect.top - rect.bottom) / 2
        positionModificator = positionModificator > 0 ? positionModificator : 0
        linePoint.y += positionModificator
      }
    }
  }

  if (position && !this.isSameElementPosition(linePoint, this.getVcvIdFromElement(element))) {
    this.clearStyle()
    this.setPoint(linePoint.x, linePoint.y)
    this.setStyle({...point, ...linePoint}, lineWidth, lineHeight, frame)
    window.setTimeout(function () {
      this.el && this.el.classList.add('vcv-is-shown')
      if (isVerticalLine) {
        this.el && this.el.classList.add('vcv-smart-line-vertical')
      } else {
        this.el && this.el.classList.remove('vcv-smart-line-vertical')
      }
      this.el && this.el.classList.add('vcv-smart-line-transition')
    }.bind(this), 0)
  } else {
    position = false
  }

  if (this.prevElement !== this.getVcvIdFromElement(element)) {
    this.prevElement = this.getVcvIdFromElement(element)
  }

  return position
}

module.exports = SmartLine
