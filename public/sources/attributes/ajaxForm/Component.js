import React from 'react'
import Attribute from '../attribute'
import vcCake from 'vc-cake'
import serialize from 'form-serialize'

export default class AjaxForm extends Attribute {

  updateState (props) {
    return {
      value: props.value,
      formContent: '<span class="vcv-ui-icon vcv-ui-wp-spinner"></span>',
      formStatus: false,
      formBound: false
    }
  }

  componentDidMount () {
    this.requestToServer()
  }

  componentWillReceiveProps (nextProps) {
    // Intentionally left blank
    // TODO: Possibly remove this hook in Attributes.js
  }

  componentDidUpdate (prevProps, prevState) {
    if (this.state.formStatus && this.refs.form && !this.state.formBound) {
      this.bindFormChangeEvents()
    }
  }

  componentWillUnmount () {
    this.serverRequest.abort()

    let elements = Array.from(this.refs.form.elements)
    elements.forEach((node) => {
      node.removeEventListener('change', this.handleFormChange.bind(this))
    })
  }

  bindFormChangeEvents () {
    let elements = Array.from(this.refs.form.elements)
    elements.forEach((node) => {
      node.addEventListener('change', this.handleFormChange.bind(this))
    })
    let aTagElements = this.refs.form.querySelectorAll('a')
    aTagElements = [].slice.call(aTagElements)
    aTagElements.forEach((node) => {
      node.setAttribute('target', '_blank')
    })
    this.setState({
      formBound: true
    })
  }

  handleFormChange (e) {
    let value = serialize(this.refs.form, { hash: true })
    this.setFieldValue(value)
  }

  requestToServer () {
    let ajax = vcCake.getService('utils').ajax

    if (this.serverRequest) {
      this.serverRequest.abort()
    }
    let action = this.props.options.action
    let value = this.state.value

    this.setState({
      formContent: '<span class="vcv-ui-icon vcv-ui-wp-spinner"></span>',
      formStatus: false,
      formBound: false
    })

    this.serverRequest = ajax({
      'vcv-action': `attribute:ajaxForm:render:adminNonce`,
      'vcv-form-action': action,
      'vcv-form-element': this.props.element.toJS(),
      'vcv-form-value': value,
      'vcv-nonce': window.vcvNonce,
      'vcv-source-id': window.vcvSourceID
    }, (result) => {
      let response = JSON.parse(result.response)
      if (response && response.status) {
        this.setState({
          formContent: response.html || 'There are no options for this widget.',
          formStatus: true,
          formBound: false
        })
      } else {
        this.setState({
          formContent: 'There are no options for this widget.',
          formStatus: false,
          formBound: false
        })
      }
    })
  }

  render () {
    return (
      <div className='vcv-ui-ajax-form-container'>
        <div ref='form'>
          <div dangerouslySetInnerHTML={{ __html: this.state.formContent || '' }} />
        </div>
      </div>
    )
  }
}
