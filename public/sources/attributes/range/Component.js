import React from 'react'
import Attribute from '../attribute'

class RangeAttribute extends Attribute {
  constructor (props) {
    super(props)
    this.state = this.updateState(this.props)

    this.setFieldValue = this.setFieldValue.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.handleBlur = this.handleBlur.bind(this)
    this.update = this.update.bind(this)
  }

  componentDidMount () {
    this.lastCall = new Date()
  }

  handleChange (event) {
    this.setFieldValue(event.currentTarget.value)
  }

  setFieldValue (val) {
    let { value } = this.props
    let { measurement } = this.props.options
    val = val.replace(measurement, '')
    val = val && val !== '-' ? parseInt(val) : val
    if (Number.isNaN(val)) {
      val = value
    }

    this.setState({ value: val.toString() }, () => {
      if (val !== '-') {
        this.update()
      }
    })
  }

  update () {
    clearInterval(this.updateInterval)
    let currentCall = new Date()
    if (currentCall - this.lastCall >= 300) {
      this.props.updater(this.props.fieldKey, this.state.value)
    } else {
      this.updateInterval = setInterval(this.update, 300)
    }
    this.lastCall = currentCall
  }

  handleBlur () {
    let { value } = this.state
    let { min } = this.props.options
    if (!value && value !== min) {
      this.setFieldValue(this.props.value)
    }
  }

  render () {
    let { value } = this.state
    let { min = 0, max = 100, measurement = '%' } = this.props.options
    let { placeholder } = this.props
    if (!placeholder && this.props.options && this.props.options.placeholder) {
      placeholder = this.props.options.placeholder
    }
    let parsedValue = parseInt(value)
    let sliderValue = Number.isInteger(parsedValue) && parsedValue > min ? value : min
    let width = `${(sliderValue - min) / (max - min) * 100}%`
    return (
      <div className='vcv-ui-form-range'>
        <div className='vcv-ui-form-range-helper'>
          <div className='vcv-ui-form-range-bg' style={{ width }} />
          <input
            className='vcv-ui-form-range-slider'
            type='range'
            onChange={this.handleChange}
            min={min}
            max={max}
            value={sliderValue} />
        </div>
        <input
          className='vcv-ui-form-input vcv-ui-form-range-input'
          type='text'
          onChange={this.handleChange}
          onBlur={this.handleBlur}
          min={min}
          max={max}
          placeholder={placeholder}
          value={`${value}${measurement}`} />
      </div>
    )
  }
}

export default RangeAttribute
