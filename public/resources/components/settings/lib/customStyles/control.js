import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

export default class StyleControl extends React.Component {
  static propTypes = {
    changeActive: PropTypes.func,
    index: PropTypes.number.isRequired,
    title: PropTypes.string,
    active: PropTypes.bool
  }

  constructor (props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick (e) {
    e && e.preventDefault()
    this.props.changeActive(this.props.index)
  }

  render () {
    let { title, active } = this.props

    let controlClass = classNames({
      'vcv-ui-style-control': true,
      'vcv-ui-state--active': active
    })
    return (
      <button className={controlClass} onClick={this.handleClick} title={title}>
        {title}
      </button>
    )
  }
}
