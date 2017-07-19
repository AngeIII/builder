import React from 'react'
import {default as Categories} from './lib/categories'

export default class AddElementPanel extends React.Component {
  static propTypes = {
    options: React.PropTypes.object
  }

  render () {
    return (
      <div className='vcv-ui-tree-view-content vcv-ui-add-element-content'>
        <Categories parent={this.props.options.element ? this.props.options.element : {}} />
      </div>
    )
  }
}
