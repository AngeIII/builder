import React from 'react'
import classNames from 'classnames'
import PropTypes from 'prop-types'

export default class HubTemplateControl extends React.Component {
  static propTypes = {
    data: PropTypes.object,
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    applyTemplate: PropTypes.func.isRequired,
    removeTemplate: PropTypes.func.isRequired,
    spinner: PropTypes.bool,
    type: PropTypes.string,
    description: PropTypes.string,
    preview: PropTypes.string,
    thumbnail: PropTypes.string,
    handleApplyTemplate: PropTypes.func.isRequired,
    handleRemoveTemplate: PropTypes.func.isRequired,
    showPreview: PropTypes.func.isRequired,
    hidePreview: PropTypes.func.isRequired,
    addTemplateText: PropTypes.string.isRequired,
    removeTemplateText: PropTypes.string.isRequired,
    previewStyle: PropTypes.object.isRequired,
    previewVisible: PropTypes.bool.isRequired
  }

  render () {
    const { name, spinner, thumbnail, preview, description, addTemplateText, removeTemplateText, handleApplyTemplate, showPreview, hidePreview, previewVisible, previewStyle } = this.props

    let nameClasses = classNames({
      'vcv-ui-item-badge vcv-ui-badge--success': false,
      'vcv-ui-item-badge vcv-ui-badge--warning': false
    })

    let applyClasses = classNames({
      'vcv-ui-item-control vcv-ui-icon vcv-ui-icon-add': true,
      'vcv-ui-state--hidden': spinner
    })

    let removeClasses = classNames({
      'vcv-ui-item-control vcv-ui-icon vcv-ui-icon-close-thin vcv-ui-form-attach-image-item-control-state--danger': true,
      'vcv-ui-state--hidden': spinner
    })

    let overlayClasses = classNames({
      'vcv-ui-item-overlay': true,
      'vcv-ui-item-overlay--visible': spinner
    })

    let previewClasses = classNames({
      'vcv-ui-item-preview-container': true,
      'vcv-ui-state--visible': previewVisible
    })

    return (
      <li className='vcv-ui-item-list-item'>
        <span className='vcv-ui-item-element'
          onMouseEnter={showPreview}
          onMouseLeave={hidePreview}
        >
          <span className='vcv-ui-item-element-content'>
            <img
              className='vcv-ui-item-element-image'
              src={thumbnail}
              alt={name}
            />
            <span className={overlayClasses}>
              <span
                className={applyClasses}
                onClick={handleApplyTemplate}
                title={addTemplateText}
              />
              <span
                className={removeClasses}
                style={{ cursor: 'not-allowed' }}
                title={removeTemplateText}
              />
            </span>
          </span>
          <span className='vcv-ui-item-element-name'>
            <span className={nameClasses}>
              {name}
            </span>
          </span>
          <figure className={previewClasses} style={previewStyle}>
            <img
              className='vcv-ui-item-preview-image'
              src={preview}
              alt={name}
            />
            <figcaption className='vcv-ui-item-preview-caption'>
              <div className='vcv-ui-item-preview-text'>
                {description}
              </div>
            </figcaption>
          </figure>
        </span>
      </li>
    )
  }
}
