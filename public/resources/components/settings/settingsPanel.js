import React from 'react'
import SettingsContent from './lib/settingsContent'
import CustomStyles from './lib/customStyles/component'
import PageSettings from './lib/pageSettings/component'
import CustomScripts from './lib/customJavascript/component'
import { env } from 'vc-cake'

export default class SettingsPanel extends React.Component {
  constructor (props) {
    super(props)
    let sections = []
    let actions = []

    /**
     * Temporary addition type
     * Add "Custom CSS" to settings
     */
    const localizations = window.VCV_I18N && window.VCV_I18N()
    const customCSSText = localizations ? localizations.customCSS : 'Custom CSS'
    const settingsText = localizations ? (env('TF_SETTINGS_THEME_ICONS') ? (localizations.layout || 'Layout') : localizations.settings) : 'Settings'
    const customJSText = localizations ? localizations.customJS : 'Custom JavaScript'

    sections.push({
      title: settingsText,
      content: PageSettings
    })

    sections.push({
      title: customCSSText,
      content: CustomStyles
    })

    sections.push({
      title: customJSText,
      content: CustomScripts
    })

    this.state = {
      sections,
      actions
    }
  }

  render () {
    const localizations = window.VCV_I18N && window.VCV_I18N()
    const settingsText = localizations ? localizations.settings : 'Settings'
    const { sections } = this.state

    return (
      <div className='vcv-ui-tree-view-content vcv-ui-add-element-content'>
        <div className='vcv-ui-tree-view-content vcv-ui-tree-view-content-accordion'>
          <div className='vcv-ui-edit-form-header'>
            <i className='vcv-ui-navbar-control-icon vcv-ui-icon vcv-ui-icon-cog vcv-ui-settings-title-icon' />
            <span className='vcv-ui-edit-form-header-title'>
              {settingsText}
            </span>
          </div>
          <div className='vcv-ui-tree-content'>
            <SettingsContent sections={sections} />
          </div>
        </div>
      </div>
    )
  }
}
