/* eslint react/jsx-no-bind:"off" */
import React from 'react'
import Attribute from '../attribute'
import classNames from 'classnames'
import vcCake from 'vc-cake'
import FieldWrapper from './field-tabs'
import Dropdown from '../dropdown/Component'
const Cook = vcCake.getService('cook')
const hubCategoriesService = vcCake.getService('hubCategories')

export default class ElementAttribute extends Attribute {
  static propTypes = {
    updater: React.PropTypes.func.isRequired,
    // api: React.PropTypes.object.isRequired,
    fieldKey: React.PropTypes.string.isRequired,
    value: React.PropTypes.object.isRequired,
    element: React.PropTypes.object.isRequired,
    options: React.PropTypes.any
  }

  constructor (props) {
    super(props)
    this.onChange = this.onChange.bind(this)
    this.onClickReplacement = this.onClickReplacement.bind(this)
    this.changeShowReplacements = this.changeShowReplacements.bind(this)
  }

  updateState (props) {
    let element = Cook.get(props.value)

    return {
      allValues: Object.assign({}, props.value),
      value: props.value,
      tag: props.value.tag,
      element: element,
      allTabs: ElementAttribute.updateTabs(element)
    }
  }

  onClickReplacement (newElement) {
    let cookElement = Cook.get(newElement)
    let allValues = Object.assign({}, this.state.allValues, this.state.value)
    if (this.props.options && this.props.options.merge) {
      Object.keys(cookElement.toJS()).forEach((key) => {
        if (allValues[ key ] !== undefined) {
          // Merge, Type, Key
          let findKey = this.props.options.merge.attributes.findIndex((item) => {
            return item.key === key && item.type === typeof allValues[ key ]
          })
          if (findKey > -1) {
            // Merge the value
            cookElement.set(key, allValues[ key ])
          }
        }
      })
    }

    let values = cookElement.toJS()
    this.setState({
      allValues: Object.assign({}, this.state.value, newElement),
      value: values,
      tag: cookElement.get('tag'),
      element: cookElement,
      allTabs: ElementAttribute.updateTabs(cookElement)
    })
    this.setFieldValue(values)
  }

  onClickReplacementDropdown (fieldKey, newElement) {
    this.onClickReplacement({ tag: newElement })
  }

  changeShowReplacements () {
    this.setState({ showReplacements: !this.state.showReplacements })
  }

  static updateTabs (element) {
    let tabs = []
    ElementAttribute.editFormTabs(element).map((tab, index) => {
      let tabsData = {
        id: tab.key,
        index: index,
        data: tab.data,
        params: ElementAttribute.editFormTabParams(element, tab.key),
        key: `element-params-tab-${element.get('id')}-${tab.key}`
      }
      tabs.push(tabsData)
    }, ElementAttribute)

    return tabs
  }

  static editFormTabs (element) {
    const group = element.get('metaEditFormTabs')
    if (group && group.each) {
      return group.each(ElementAttribute.editFormTabsIterator.bind(this, element))
    }
    return []
  }

  static editFormTabsIterator (element, item) {
    return {
      key: item,
      value: element.get(item),
      data: element.settings(item)
    }
  }

  static editFormTabParams (element, tabName) {
    const value = element.get(tabName)
    const settings = element.settings(tabName)
    if (settings.settings.type === 'group' && value && value.each) {
      return value.each(ElementAttribute.editFormTabsIterator.bind(this, element))
    }
    // In case if tab is single param holder
    return [ {
      key: tabName,
      value: value,
      data: settings
    } ]
  }

  onChange () {
    this.setFieldValue(this.state.element.toJS())
  }

  render () {
    let { category, tabLabel, replaceView } = this.props.options
    let replacements = ''
    category = category || '*'
    let elementLabel = tabLabel && tabLabel.toLowerCase() || category.toLowerCase() || 'element'
    let categorySettings = hubCategoriesService.get(category)
    const localizations = window.VCV_I18N && window.VCV_I18N()
    const replaceElementText = localizations.replaceElementText.split('{elementLabel}').join(elementLabel)
    if (categorySettings && this.state.showReplacements) {
      let replacementItemsOutput = categorySettings.elements.map((tag) => {
        let cookElement = Cook.get({ tag: tag })
        if (!cookElement) {
          return null
        }
        let nameClasses = classNames({
          'vcv-ui-item-badge vcv-ui-badge--success': false,
          'vcv-ui-item-badge vcv-ui-badge--warning': false
        })
        let itemContentClasses = classNames({
          'vcv-ui-item-element-content': true,
          'vcv-ui-item-list-item-content--active': this.state.tag === tag
        })

        let publicPathThumbnail = cookElement.get('metaThumbnailUrl')

        return <li key={'vcv-replace-element-' + cookElement.get('tag')} className='vcv-ui-item-list-item'>
          <span
            className='vcv-ui-item-element'
            onClick={this.onClickReplacement.bind(this, { tag: tag })}
          >
            <span className={itemContentClasses}>
              <img className='vcv-ui-item-element-image' src={publicPathThumbnail}
                alt='' />
              <span className='vcv-ui-item-overlay'>
                <span className='vcv-ui-item-add vcv-ui-icon vcv-ui-icon-add' />
              </span>
            </span>
            <span className='vcv-ui-item-element-name'>
              <span className={nameClasses}>
                {cookElement.get('name')}
              </span>
            </span>
          </span>
        </li>
      })

      replacements = (
        <div className='vcv-ui-replace-element-container'>
          <span className='vcv-ui-replace-element-hide' title='Close' onClick={this.changeShowReplacements}>
            <i className='vcv-layout-bar-content-hide-icon vcv-ui-icon vcv-ui-icon-close-thin' />
          </span>
          <ul className='vcv-ui-replace-element-list'>
            {replacementItemsOutput}
          </ul>
        </div>
      )
    } else {
      replacements = (
        <div>
          <p
            className='vcv-ui-form-helper'
          >
            {replaceElementText}

          </p>
          <button type='button' className='vcv-ui-form-button vcv-ui-form-button--default'
            onClick={this.changeShowReplacements}>
            Replace {elementLabel}
          </button>
        </div>
      )
    }

    let replacementBlock = ''
    if (categorySettings && categorySettings.elements && categorySettings.elements.length > 1) {
      // TODO: show another wrapper
      if (replaceView && replaceView === 'dropdown') {
        let dropdownValues = categorySettings.elements.map(
          (tag) => {
            let cookElement = Cook.get({ tag: tag })
            if (!cookElement) {
              return {}
            }
            return {
              label: cookElement.get('name'),
              value: tag
            }
          }
        )
        replacementBlock = (
          <div className='vcv-ui-form-group vcv-ui-replace-element-block-dropdown'>
            <Dropdown
              fieldKey='replaceElement'
              updater={this.onClickReplacementDropdown.bind(this)} // TODO: Tag
              value={this.state.value.tag}
              options={{
                values: dropdownValues
              }}
            />
          </div>
        )
      } else {
        replacementBlock = (
          <div className='vcv-ui-replace-element-block'>
            {replacements}
          </div>
        )
      }
    }

    return <div className='vcv-ui-form-element'>
      {replacementBlock}
      <FieldWrapper
        onChange={this.onChange}
        element={this.state.element}
        allTabs={this.state.allTabs}
      />
    </div>
  }
}
