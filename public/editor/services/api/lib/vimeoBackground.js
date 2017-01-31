import React from 'react'
import classNames from 'classnames'
const { Component, PropTypes } = React
export default class VimeoBackground extends Component {
  static propTypes = {
    id: PropTypes.string,
    atts: PropTypes.object,
    editor: PropTypes.object
  }

  render () {
    let vcvHelperHTML = `<div class="vce-asset-video-vimeo-player" />`
    let containerClasses = [
      `vce-asset-video-vimeo-container`,
      `vce-visible-${this.props.device}-only`
    ]
    return <div className={classNames(containerClasses)}>
      <div className='vce-asset-video-vimeo-background'
        data-vce-assets-video-vimeo={this.props.settings.videoId}
        data-vce-assets-video-replacer='.vce-asset-video-vimeo-player'
        data-vce-assets-video-orientation-class='vce-asset-video-vimeo--state-landscape'>
        <div className='vce-asset-video-vimeo-sizer' />
        <vcvhelper data-vcvs-html={vcvHelperHTML} dangerouslySetInnerHTML={{ __html: vcvHelperHTML }} />
      </div>
    </div>
  }
}
