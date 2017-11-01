import React from 'react'
import Attribute from '../attribute'

export default class Dropdown extends Attribute {
  selectChildren = null

  componentWillReceiveProps (nextProps) {
    super.componentWillReceiveProps(nextProps)
    this.generateSelectChildren(nextProps)
  }

  componentWillMount () {
    this.generateSelectChildren(this.props)
  }

  createGroup (key, groupObject, fieldKey) {
    let optionElements = []
    let { values, label } = groupObject
    let labelValue = label.replace(/\s+/g, '')
    for (let key in values) {
      if (values.hasOwnProperty(key)) {
        optionElements.push(this.createOptions(key, values, fieldKey))
      }
    }
    return <optgroup key={fieldKey + ':' + key + ':' + labelValue} label={label}>{optionElements}</optgroup>
  }

  createOptions (key, values, fieldKey) {
    let value = values[ key ].value
    let label = values[ key ].label
    return <option key={fieldKey + ':' + key + ':' + value} value={value}>{label}</option>
  }

  getSelectOptions (props) {
    if (!props) {
      props = this.props
    }
    let { values } = props.options || {}
    let { global } = props.options || {}
    if (global && (!values || !values.length)) {
      if (typeof window[ global ] === 'function') {
        values = window[ global ]()
      } else {
        values = window[ global ] || []
      }
    }

    return values
  }

  generateSelectChildren (props) {
    let optionElements = []
    let values = this.getSelectOptions(props)
    let { fieldKey } = props

    for (let key in values) {
      if (values.hasOwnProperty(key)) {
        if (values[ key ].hasOwnProperty('group')) {
          optionElements.push(this.createGroup(key, values[ key ].group, fieldKey))
        } else {
          optionElements.push(this.createOptions(key, values, fieldKey))
        }
      }
    }

    this.selectChildren = optionElements
  }

  render () {
    let { value } = this.state

    return (
      <select
        value={value}
        onChange={this.handleChange}
        className='vcv-ui-form-dropdown'>
        {this.selectChildren}
      </select>
    )
  }
}
