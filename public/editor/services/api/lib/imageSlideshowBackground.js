import React from 'react'
import classNames from 'classnames'
import ReactDOMServer from 'react-dom/server'

const { Component, PropTypes } = React
export default class ImageSlideshowBackground extends Component {
  static propTypes = {
    id: PropTypes.string,
    atts: PropTypes.object,
    editor: PropTypes.object
  }

  getPublicImage (filename) {
    let { metaAssetsPath } = this.props.atts
    return filename.match('^(https?:)?\\/\\/?') ? filename : metaAssetsPath + filename
  }

  render () {
    const { reactKey, deviceKey, deviceData } = this.props
    const { images, backgroundStyle, backgroundPosition, sliderTimeout, sliderEffect, sliderDirection } = deviceData
    let timeout = sliderTimeout
    if (!timeout) {
      timeout = sliderEffect === 'carousel' ? 10 : 5
    }
    if (images) {
      let imagesJSX = []
      if (images.urls && images.urls.length) {
        images.urls.forEach((imgData) => {
          let styles = {
            backgroundImage: `url(${imgData.full})`
          }
          let imgKey = `${reactKey}-${imgData.id}`
          imagesJSX.push((
            <div className='vce-asset-background-slider-item' style={styles} key={imgKey} />
          ))
        })
      } else if (images.length) {
        images.forEach((imgData, index) => {
          let styles = {
            backgroundImage: `url(${this.getPublicImage(imgData)})`
          }
          let imgKey = `${reactKey}-${imgData}-${index}`
          imagesJSX.push((
            <div className='vce-asset-background-slider-item' style={styles} key={imgKey} />
          ))
        })
      }
      let containerClasses = [
        `vce-asset-background-slider-container`,
        `vce-visible-${deviceKey}-only`
      ]
      if (backgroundStyle) {
        containerClasses.push(`vce-asset-background-slider--style-${backgroundStyle}`)
      }
      if (backgroundPosition) {
        containerClasses.push(`vce-asset-background-slider--position-${backgroundPosition}`)
      }
      let slideshowClasses = [
        `vce-asset-background-slider`
      ]

      let sliderProps = {
        'data-vce-assets-slider': timeout,
        'data-vce-assets-slider-effect': sliderEffect,
        'data-vce-assets-slider-direction': sliderDirection,
        'data-vce-assets-slider-slides': '.vce-asset-background-slider-items',
        'data-vce-assets-slider-slide': '.vce-asset-background-slider-item'
      }

      let vcvHelperHTML = ReactDOMServer.renderToStaticMarkup(
        <div className={classNames(slideshowClasses)} {...sliderProps}>
          <div className='vce-asset-background-slider-items'>
            {imagesJSX}
          </div>
        </div>)

      return <div className={classNames(containerClasses)}>
        <vcvhelper data-vcvs-html={vcvHelperHTML} dangerouslySetInnerHTML={{ __html: vcvHelperHTML }} />
      </div>
    }
    return null
  }
}
