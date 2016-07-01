/*eslint jsx-quotes: [2, "prefer-double"]*/
var React = require('react')
var ReactDOM = require('react-dom')
var classNames = require('classnames')

var CategoryTab = React.createClass({
  propTypes: {
    container: React.PropTypes.string,
    changeActive: React.PropTypes.func,
    id: React.PropTypes.string.isRequired,
    index: React.PropTypes.number.isRequired,
    title: React.PropTypes.string,
    active: React.PropTypes.bool
  },
  getInitialState: function () {
    return {
      realWidth: undefined
    }
  },
  componentDidMount: function () {
    this.setState({
      realWidth: this.getRealWidth()
    })
  },

  getRealWidth: function () {
    let realWidth = this.state.realWidth

    if (realWidth === undefined) {
      let $el = ReactDOM.findDOMNode(this)
      let $tempEl = $el.cloneNode(true)
      $tempEl.style.position = 'fixed'
      $el.closest(this.props.container).appendChild($tempEl)
      realWidth = $tempEl.offsetWidth
      if (realWidth === 0) {
        return undefined
      }
      let style = window.getComputedStyle($tempEl, null)
      realWidth += parseInt(style.marginLeft) + parseInt(style.marginRight)

      $tempEl.remove()
    }
    return realWidth
  },

  clickHandler: function () {
    this.props.changeActive(this.props.index)
  },

  render: function () {
    let { title, active } = this.props

    var tabClasses = classNames({
      'vcv-ui-editor-tab': true,
      'vcv-ui-state--active': active
    })

    return (
      <a className={tabClasses} href="#" onClick={this.clickHandler}>
        <span className="vcv-ui-editor-tab-content">
          <span>{title}</span>
        </span>
      </a>
    )
  }
})
module.exports = CategoryTab
