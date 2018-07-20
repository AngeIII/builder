/* eslint-disable import/no-webpack-loader-syntax */
/* eslint react/jsx-no-bind: "off" */

import React from 'react'
import vcCake from 'vc-cake'
import lodash from 'lodash'

import Attribute from '../attribute'
import DefaultLayouts from './lib/defaultLayouts'
import TokenizationList from './lib/tokenizationList'
import Toggle from '../toggle/Component'
import LayoutResponsiveness from './lib/layoutResponsiveness'

export default class Layout extends Attribute {
  static defaultProps = {
    layouts: [
      [ '100%' ],
      [ '50%', '50%' ],
      [ '33.33%', '33.33%', '33.33%' ],
      [ '25%', '25%', '25%', '25%' ],
      [ '20%', '20%', '20%', '20%', '20%' ],
      [ '16.66%', '16.66%', '16.66%', '16.66%', '16.66%', '16.66%' ],
      [ '66.66%', '33.34%' ],
      [ '25%', '75%' ],
      [ '25%', '50%', '25%' ],
      [ '16.66%', '66.66%', '16.66%' ]
    ],
    suggestions: [
      '100%',
      '50%',
      '33.33%',
      '25%',
      '20%',
      '16.66%',
      '66.66%',
      '75%',
      'auto'
    ]
  }
  static attributeMixins = {
    columnStyleMixin: {
      src: require('raw-loader!./cssMixins/columnStyles.pcss'),
      variables: {
        device: {
          value: false
        },
        selector: {
          value: false
        },
        numerator: {
          value: false
        },
        denominator: {
          value: false
        },
        columnGap: {
          value: false
        },
        spaceForColumn: {
          value: false
        },
        fullColumn: {
          value: false
        },
        autoColumn: {
          value: false
        },
        percentage: {
          value: false
        },
        percentageSelector: {
          value: false
        }
      }
    }
  }
  static devices = [ 'xs', 'sm', 'md', 'lg', 'xl' ]
  static localizations = window.VCV_I18N && window.VCV_I18N()
  static deviceData = [
    {
      deviceKey: 'xl',
      title: Layout.localizations ? Layout.localizations.desktop : 'Desktop',
      className: 'desktop'
    },
    {
      deviceKey: 'lg',
      title: Layout.localizations ? Layout.localizations.tabletLandscape : 'Tablet Landscape',
      className: 'tablet-landscape'
    },
    {
      deviceKey: 'md',
      title: Layout.localizations ? Layout.localizations.tabletPortrait : 'Tablet Portrait',
      className: 'tablet-portrait'
    },
    {
      deviceKey: 'sm',
      title: Layout.localizations ? Layout.localizations.mobileLandscape : 'Mobile Landscape',
      className: 'mobile-landscape'
    },
    {
      deviceKey: 'xs',
      title: Layout.localizations ? Layout.localizations.mobilePortrait : 'Mobile Portrait',
      className: 'mobile-portrait'
    }
  ]

  static buildMixins (data) {
    let layoutData = Layout.getLayoutData(data.id)

    if (!layoutData.hasOwnProperty('all') && !layoutData.hasOwnProperty('xs')) {
      return null
    }

    let newMixin = {}

    let columnGap = data.columnGap ? parseInt(data.columnGap) : 0
    let selector = `vce-row--col-gap-${columnGap}#el-${data.id}`
    const disableStacking = data && data.layout && data.layout.hasOwnProperty('disableStacking') ? data.layout.disableStacking : false
    const responsivenessSettings = data && data.layout && data.layout.hasOwnProperty('responsivenessSettings') ? data.layout.responsivenessSettings : false

    Layout.devices.forEach((device) => {
      let currentLayout = layoutData[ 'all' ] || layoutData[ device ]
      let reducedLayout = []
      currentLayout.forEach((col) => {
        if (reducedLayout.indexOf(col) < 0) {
          reducedLayout.push(col)
        }
      })

      reducedLayout.forEach((col, index) => {
        let mixinName = ''
        let fraction = ''
        if (col.indexOf('%') >= 0) {
          let numerator = parseFloat(col.replace('%', '').replace(',', '.'))
          fraction = [ numerator, 100 ]
        } else {
          fraction = col.split('/')
        }

        if (col !== 'auto') {
          mixinName = `${'columnStyleMixin'}:col${fraction[ 0 ]}/${fraction[ 1 ]}:gap${columnGap}:${device}`
        } else {
          mixinName = `${'columnStyleMixin'}:col${col}:gap${columnGap}:${device}`
        }

        if (device === 'xs') {
          if (!disableStacking && !responsivenessSettings) {
            mixinName = `${'columnStyleMixin'}:col1:xs`
          }
        }
        // put index in the beginning of key to sort columns
        mixinName = `${Layout.devices.indexOf(device)}:${mixinName}`

        newMixin[ mixinName ] = lodash.defaultsDeep({}, Layout.attributeMixins.columnStyleMixin)
        newMixin[ mixinName ].variables.selector.value = selector
        newMixin[ mixinName ].variables.device.value = device

        if (device === 'xs') {
          if (!disableStacking && !responsivenessSettings) {
            newMixin[ mixinName ].variables.fullColumn.value = true
          }
        }
        const percentages = (fraction[ 0 ] / fraction[ 1 ] * 100).toFixed(2)
        const spaceForColumn = (columnGap - (columnGap * (parseFloat(percentages) / 100))).toString()

        if (col !== 'auto') {
          if (col.indexOf('%') >= 0) {
            newMixin[ mixinName ].variables.percentageSelector.value = col.replace('%', '').replace(',', '-').replace('.', '-')
          } else {
            newMixin[ mixinName ].variables.numerator.value = fraction[ 0 ]
            newMixin[ mixinName ].variables.denominator.value = fraction[ 1 ]
          }
          newMixin[ mixinName ].variables.percentage.value = percentages
        } else {
          newMixin[ mixinName ].variables.autoColumn.value = true
        }
        newMixin[ mixinName ].variables.columnGap.value = columnGap.toString()
        newMixin[ mixinName ].variables.spaceForColumn.value = (Math.round(spaceForColumn * 100) / 100).toFixed(2)
      })
    })
    return newMixin
  }

  static getLayoutData (rowId, getDefault) {
    const deviceLayoutData = {}
    const rowChildren = vcCake.getService('document').children(rowId)

    // Get layout for 'all'
    rowChildren.forEach((element) => {
      if (element.size['all']) {
        if (!deviceLayoutData.hasOwnProperty('all')) {
          deviceLayoutData.all = []
        }
        deviceLayoutData['all'].push(element.size['all'])
      }

      if (getDefault && element.size['defaultSize']) {
        if (!deviceLayoutData.hasOwnProperty('defaultSize')) {
          deviceLayoutData.defaultSize = []
        }
        deviceLayoutData['defaultSize'].push(element.size['defaultSize'])
      }
    })

    if (!deviceLayoutData.hasOwnProperty('all')) { // Get layout for devices, if 'all' is not defined
      Layout.devices.forEach((device) => {
        rowChildren.forEach((element) => {
          if (element.size[device]) {
            if (!deviceLayoutData.hasOwnProperty(device)) {
              deviceLayoutData[device] = []
            }
            deviceLayoutData[device].push(element.size[device])
          }
        })
      })
    } else { // Copy layout for devices from 'all' if 'all' is defined
      Layout.devices.forEach((device) => {
        deviceLayoutData[device] = deviceLayoutData['all']
      })
    }
    return deviceLayoutData
  }

  constructor (props) {
    super(props)
    this.setActiveLayout = this.setActiveLayout.bind(this)
    this.validateSize = this.validateSize.bind(this)
    this.valueChangeHandler = this.valueChangeHandler.bind(this)
    this.handleColumnHover = this.handleColumnHover.bind(this)
  }

  updateState (props) {
    let deviceLayoutData = {}

    if (props.value && props.value.layoutData && (props.value.layoutData['all'] || props.value.layoutData['xs'])) {
      deviceLayoutData = props.value.layoutData
    } else {
      deviceLayoutData = Layout.getLayoutData(props.element.get('id'), true)
    }

    const defaultLayoutData = deviceLayoutData.defaultSize ? deviceLayoutData.defaultSize : []
    const reverseColumnState = props.value && props.value.reverseColumn ? props.value.reverseColumn : false
    const disableStackingState = props.value && props.value.disableStacking ? props.value.disableStacking : false
    const responsivenessSettingsState = props.value && props.value.responsivenessSettings ? props.value.responsivenessSettings : false
    return {
      value: {
        layoutData: deviceLayoutData,
        defaultLayoutData: defaultLayoutData,
        reverseColumn: reverseColumnState,
        disableStacking: disableStackingState,
        responsivenessSettings: responsivenessSettingsState
      }
    }
  }

  updateDevicesLayout (defaultLayout, newState) {
    newState.layoutData[ 'all' ] = defaultLayout
    newState.defaultLayoutData = defaultLayout
    for (let device in newState.layoutData) {
      if (newState.layoutData.hasOwnProperty(device)) {
        let deviceLayout = newState.layoutData[ device ]
        if (device !== 'all') {
          deviceLayout.length = 0
          defaultLayout.forEach((col, i) => {
            if (!deviceLayout[ i ] && col) {
              deviceLayout.push(col)
            }
          })
        }
      }
    }
    return newState
  }

  setActiveLayout (layout, options) {
    let newState = lodash.defaultsDeep({}, this.state.value)
    if (options && options.device) {
      newState.layoutData[ options.device ][ options.index ] = layout
    } else {
      newState = this.updateDevicesLayout(layout, newState)
    }
    this.setFieldValue(newState)
  }

  setFieldValue (value) {
    let { updater, fieldKey } = this.props
    let { layoutData, ...rest } = value
    if (value.responsivenessSettings) {
      delete layoutData[ 'all' ]
    } else {
      layoutData['all'] = value.defaultLayoutData
      delete layoutData[ 'xs' ]
      delete layoutData[ 'sm' ]
      delete layoutData[ 'md' ]
      delete layoutData[ 'lg' ]
      delete layoutData[ 'xl' ]
    }
    const sanitizedValue = {}
    for (let device in layoutData) {
      if (layoutData.hasOwnProperty(device)) {
        sanitizedValue[device] = this.sanitizeLayout(layoutData[device])
      }
    }
    updater(fieldKey, {
      layoutData: sanitizedValue,
      ...rest
    })
    this.setState({
      value: value
    })
  }

  sanitizeLayout (value) {
    return value.filter((col) => {
      return this.validateSize(col)
    })
  }

  validateSize (text) {
    if (text === 'auto') {
      return true
    }
    let fractionRegex = /^(\d+)\/(\d+)$/

    if (fractionRegex.test(text)) {
      // test if fraction is less than 1
      let results = fractionRegex.exec(text)
      let numerator = parseInt(results[ 1 ])
      let denominator = parseInt(results[ 2 ])
      return numerator <= denominator
    }

    let percentageRegex = /^(\d+)([,.]\d+)?%/
    if (percentageRegex.test(text)) {
      // test if percentage is more than 1 and less than 100
      let percentage = parseFloat(text.replace('%', '').replace(',', '.'))
      return percentage >= 1 && percentage <= 100
    }
    return false
  }

  getReverseToggle () {
    let data = this.state.value
    if (data && data.disableStacking) {
      return null
    }
    let reverseState = data && data.hasOwnProperty('reverseColumn') ? data.reverseColumn : false
    return (
      <div className='vcv-ui-form-group'>
        <div className='vcv-ui-form-layout-reverse-column-toggle'>
          <Toggle
            api={this.props.api}
            fieldKey={'reverseColumn'}
            updater={this.valueChangeHandler}
            options={{ labelText: 'Reverse column stacking' }}
            value={reverseState}
          />
        </div>
      </div>
    )
  }

  valueChangeHandler (fieldKey, value) {
    let newState = lodash.defaultsDeep({}, this.state.value)
    newState[ fieldKey ] = value
    if (fieldKey === 'responsivenessSettings' && value && newState[ 'disableStacking' ]) {
      newState[ 'disableStacking' ] = false
    }
    this.setFieldValue(newState)
  }

  getStackingToggle () {
    let data = this.state.value
    if (data && data.responsivenessSettings) {
      return null
    }
    let disableStackingState = data && data.hasOwnProperty('disableStacking') ? data.disableStacking : false
    return (
      <div className='vcv-ui-form-group'>
        <div className='vcv-ui-form-layout-disable-stacking-toggle'>
          <Toggle
            api={this.props.api}
            fieldKey={'disableStacking'}
            updater={this.valueChangeHandler}
            options={{ labelText: 'Disable column stacking' }}
            value={disableStackingState}
          />
        </div>
      </div>
    )
  }

  getResponsiveToggle () {
    let data = this.state.value
    let responsivenessSettingsState = data && data.hasOwnProperty('responsivenessSettings') ? data.responsivenessSettings : false
    return (
      <div className='vcv-ui-form-group'>
        <div className='vcv-ui-form-custom-responsiveness-toggle'>
          <Toggle
            api={this.props.api}
            fieldKey={'responsivenessSettings'}
            updater={this.valueChangeHandler}
            options={{ labelText: 'Custom responsiveness settings' }}
            value={responsivenessSettingsState}
          />
        </div>
      </div>
    )
  }

  handleColumnHover (options) {
    const newState = {}
    newState[options.type] = options.over ? options.index : false
    this.setState(newState)
  }

  render () {
    let { layoutData, responsivenessSettings, defaultLayoutData } = this.state.value
    let responsiveness = responsivenessSettings
      ? <LayoutResponsiveness
        layouts={this.props.layouts}
        layoutData={layoutData}
        onChange={this.setActiveLayout}
        validator={this.validateSize}
        devices={Layout.deviceData}
        defaultLayoutData={defaultLayoutData}
        activeColumn={this.state.activeColumn}
        handleColumnHover={this.handleColumnHover}
        {...this.props} />
      : null
    return (
      <div className='vcv-ui-form-layout'>
        <span className='vcv-ui-form-layout-description'>Specify number of columns within row by choosing preset
or enter custom values. Extend row layout by customizing
responsiveness options and stacking order.
        </span>
        <DefaultLayouts layouts={this.props.layouts} value={this.sanitizeLayout(defaultLayoutData)}
          onChange={this.setActiveLayout} />
        <div className='vcv-ui-form-layout-custom-layout'>
          <span className='vcv-ui-form-group-heading'>Custom row layout</span>
          <div className='vcv-ui-row vcv-ui-row-gap--md'>
            <div className='vcv-ui-col vcv-ui-col--md-6'>
              <div className='vcv-ui-form-layout-custom-layout-columns'>
                <div className='vcv-ui-form-layout-custom-layout-col vcv-ui-form-layout-custom-layout-input-wrapper'>
                  <div className='vcv-ui-form-layout-custom-layout-input'>
                    <TokenizationList
                      layouts={this.props.layouts}
                      value={defaultLayoutData.join(' + ')}
                      onChange={this.setActiveLayout}
                      validator={this.validateSize}
                      suggestions={this.props.suggestions}
                      handleColumnHover={this.handleColumnHover}
                      activeToken={this.state.activeToken}
                    />
                    <p className='vcv-ui-form-helper'>Enter custom layout option for columns by using percentages, fractions or ‘auto’ value (ex. 50% + 50%; 1/3 + 1/3 + 1/3; auto + auto).</p>
                  </div>
                </div>
              </div>
            </div>
            <div className='vcv-ui-col vcv-ui-col--md-6'>
              {this.getStackingToggle()}
              {this.getReverseToggle()}
            </div>
          </div>
        </div>
        <div className='vcv-ui-form-layout-responsiveness'>
          {this.getResponsiveToggle()}
          {responsiveness}
        </div>
      </div>
    )
  }
}
