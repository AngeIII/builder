import vcCake from 'vc-cake'
import TreeForm from './lib/form'

const DocumentData = vcCake.getService('document')
const cook = vcCake.getService('cook')

import './css/init.less'

vcCake.add('ui-edit-element', (api) => {
  let currentElement = null
  api.addAction('setCurrent', (parent) => {
    currentElement = parent
  })
  api.addAction('getCurrent', () => {
    return currentElement
  })

  api.reply('app:edit', (id) => {
    api.notify('show', id)
  })
  api
    .on('hide', () => {
      api.actions.setCurrent(null)
      api.module('ui-layout-bar').do('setEndContent', null)
      api.module('ui-layout-bar').do('setEndContentVisible', false)
    })
    .on('show', (id) => {
      api.actions.setCurrent(id)
      let data = DocumentData.get(id)
      let element = cook.get(data)
      api.module('ui-layout-bar').do('setEndContent', TreeForm, {
        element: element,
        api: api
      })
      api.module('ui-layout-bar').do('setEndContentVisible', true)
    })
    .reply('data:remove', (id) => {
      if (id === api.actions.getCurrent()) {
        api.notify('hide')
      }
    })
})
