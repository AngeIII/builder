import vcCake from 'vc-cake'
import postcss from 'postcss'
import postcssClean from 'postcss-clean'
import postcssCustomProps from 'postcss-custom-properties'
import postcssAdvancedVars from 'postcss-advanced-variables'
import postcssColor from 'postcss-color-function'
import postcssNested from 'postcss-nested'
import postcssPrefixUrl from 'postcss-prefix-url'
import postcssMedia from 'postcss-custom-media'

class StylesManager {
  constructor (styles = []) {
    this.styles = styles
  }

  get () {
    return this.styles
  }

  add (styles) {
    this.styles = this.styles.concat(styles)
    return this
  }

  getViewports () {
    let devices = [
      {
        prefixes: [ `all` ],
        min: null,
        max: null
      },
      {
        prefixes: [ `xs`, `mobile-portrait` ],
        min: null,
        max: '543px' // mobile-landscape.min - 1
      },
      {
        prefixes: [ `sm`, `mobile-landscape` ],
        min: '544px',
        max: '767px' // tablet-portrait.min - 1
      },
      {
        prefixes: [ `md`, `tablet-portrait` ],
        min: '768px',
        max: '991px' // tablet-landscape.min - 1
      },
      {
        prefixes: [ `lg`, `tablet-landscape` ],
        min: '992px',
        max: '1199px' // desktop.min - 1
      },
      {
        prefixes: [ `xl`, `desktop` ],
        min: '1200px',
        max: null
      }
    ]

    let viewports = {}
    devices.forEach((device) => {
      device.prefixes.forEach((prefix) => {
        let queries = [ 'all' ]
        // mobile-first queries
        if (device.min) {
          queries.push(`(min-width: ${device.min})`)
        }
        viewports[ `--${prefix}` ] = queries.join(' and ')
        // viewport specific queries
        if (device.max) {
          queries.push(`(max-width: ${device.max})`)
        }
        viewports[ `--${prefix}-only` ] = queries.join(' and ')
      })
    })
    return viewports
  }

  compile (join = true) {
    let iterations = []
    this.get().forEach((style) => {
      let stylePromise = new Promise((resolve, reject) => {
        let use = []
        if (style.hasOwnProperty('variables')) {
          use.push(postcssAdvancedVars({
            variables: style.variables
          }))
          use.push(postcssCustomProps(style.variables))
        } else {
          use.push(postcssAdvancedVars())
          use.push(postcssCustomProps())
        }

        let viewports = this.getViewports()
        if (style.hasOwnProperty('viewports')) {
          viewports = style.viewports
        }
        use.push(postcssMedia({
          extensions: viewports
        }))

        if (style.path) {
          use.push(postcssPrefixUrl({
            useUrl: true,
            prefix: style.path
          }))
        }

        use.push(postcssColor)
        use.push(postcssNested)
        use.push(postcssClean)
        postcss(use).process(style.src)
          .then((result) => {
            resolve(result.css)
          })
          .catch((result) => {
            window.console && window.console.warn && window.console.warn('Failed to compile css', style, result)
            resolve('')
          })
      })
      iterations.push(stylePromise)
    })

    if (join) {
      return Promise.all(iterations).then((output) => {
        return output.join(' ')
      })
    }
    return Promise.all(iterations)
  }
}
const service = {
  create (data) {
    return new StylesManager(data)
  }
}
vcCake.addService('stylesManager', service)
