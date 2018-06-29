import vcCake from 'vc-cake'

let elements = window && window.VCV_HUB_GET_ELEMENTS ? window.VCV_HUB_GET_ELEMENTS() : {}

const API = {
  all: () => {
    return elements
  },
  add: (data) => {
    elements[ data.tag ] = data
  },
  get: (tag) => {
    return elements && elements[tag] ? elements[tag] : null
  }
}

vcCake.addService('hubElements', API)
