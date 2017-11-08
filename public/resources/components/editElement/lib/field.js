import React from 'react'
import {format} from 'util'
import {getStorage} from 'vc-cake'

const elementsStorage = getStorage('elements')

export default class Field extends React.Component {
  static propTypes = {
    element: React.PropTypes.object.isRequired,
    fieldKey: React.PropTypes.string.isRequired,
    updater: React.PropTypes.func.isRequired
  }

  constructor (props) {
    super(props)
    this.updateElementOnExternalChange = this.updateElementOnExternalChange.bind(this)
    this.state = {
      element: props.element
    }
  }

  componentDidMount () {
    const { element, fieldKey } = this.props
    elementsStorage.state(`element:${element.get('id')}:attribute:${fieldKey}`)
      .onChange(this.updateElementOnExternalChange)
  }

  componentWillUnmount () {
    const { element, fieldKey } = this.props
    const id = element.get('id')
    elementsStorage.state(`element:${id}:attribute:${fieldKey}`)
      .ignoreChange(this.updateElementOnExternalChange)
    elementsStorage.state(`element:${id}:attribute:${fieldKey}`).delete()
  }

  updateElementOnExternalChange (value) {
    const { element } = this.state
    const { fieldKey } = this.props
    element.set(fieldKey, value)
    this.setState({ element: element })
  }

  render () {
    const { fieldKey, updater, tab } = this.props
    const { element } = this.state
    let { type, settings } = element.settings(fieldKey)
    let AttributeComponent = type.component
    if (!AttributeComponent) {
      return null
    }
    if (!settings) {
      throw new Error(format('Wrong attribute settings %s', fieldKey))
    }
    if (!type) {
      throw new Error(format('Wrong attribute type %s', fieldKey))
    }
    const { options } = settings
    const tabTypeName = tab.data.type.name
    let label = ''
    if (options && typeof options.label === 'string' && tabTypeName === 'group') {
      label = (<span className='vcv-ui-form-group-heading'>{options.label}</span>)
    }
    let description = ''
    if (options && typeof options.description === 'string') {
      description = (<p className='vcv-ui-form-helper'>{options.description}</p>)
    }
    if (options && options.descriptionHTML) {
      description = (<p className='vcv-ui-form-helper' dangerouslySetInnerHTML={{ __html: options.descriptionHTML }} />)
    }
    let rawValue = type.getRawValue(element.data, fieldKey)
    let defaultValue = settings.defaultValue
    if (typeof defaultValue === `undefined`) {
      defaultValue = settings.value
    }
    return (
      <div className='vcv-ui-form-group' key={`form-group-field-${element.get('id')}-${fieldKey}`}>
        {label}
        <AttributeComponent
          key={'attribute-' + fieldKey + element.get('id')}
          options={options}
          value={rawValue}
          defaultValue={defaultValue}
          fieldKey={fieldKey}
          updater={updater}
          element={element}
          ref='domComponent'
        />
        {description}
      </div>
    )
  }
}
