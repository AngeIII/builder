import vcCake from 'vc-cake'
import ReactDOM from 'react-dom'

const ActionsManager = {
  do: (actionData, state, target, element) => {
    let { action, options } = actionData
    ActionsManager.actions[ action || 'ping' ].call(ActionsManager, state, target, options, element)
  },
  actions: {
    ping: (state, target, options) => {
      console.log('ping', state, target, options)
    },
    alert: (state, target, options) => {
    },
    toggleVisibility: (state, target, options) => {
      if (typeof options !== 'undefined') {
        // Reverse state
        state = options ? !state : state
      }
      ActionsManager.actions.updateDependenciesClasses.call(this, state, target, {
        class: 'vcv-ui-state--visible'
      })
      ActionsManager.actions.updateDependenciesClasses.call(this, !state, target, {
        class: 'vcv-ui-state--hidden'
      })
      /*
       lodash.delay(() => {
       ActionsManager.actions.checkTabsDropdown.call(this, state, target, options)
       }, 50)
       */
    },
    toggleSectionVisibility: (state, target, options) => {
      if (typeof options !== 'undefined') {
        // Reverse state
        state = options ? !state : state
      }
      ActionsManager.actions.updateSectionDependenciesClasses.call(this, state, target, {
        class: 'vcv-ui-state--visible'
      })
      ActionsManager.actions.updateSectionDependenciesClasses.call(this, !state, target, {
        class: 'vcv-ui-state--hidden'
      })
      /*
       lodash.delay(() => {
       ActionsManager.actions.checkTabsDropdown.call(this, state, target, options)
       }, 50)
       */
    },
    checkTabsDropdown: (state, target, options) => {
      // TODO: Check if it works vcv-ui-editor-tab-dropdown-content not found
      let $el = ReactDOM.findDOMNode(target.ref)
      let $form = $el.closest('.vcv-ui-tree-content')
      if ($form) {
        let $dropdownContent = $form.querySelector('.vcv-ui-editor-tab-dropdown-content')
        if ($dropdownContent) {
          let hideTab = $dropdownContent.querySelectorAll('.vcv-ui-form-dependency').length ===
            $dropdownContent.querySelectorAll('.vcv-ui-form-dependency.vcv-ui-state--hidden').length

          $dropdownContent.parentNode.classList.toggle('vcv-ui-state--hidden', hideTab)
        }
      }
    },
    attachImageUrls: (state, target, options, element) => {
      if (element.settings(target.key).settings.options.url === state) {
        return
      }
      element.settings(target.key).settings.options.url = state
      target.refComponent.forceUpdate()
    },
    updateDependenciesClasses: (state, target, options, element) => {
      let newStateClasses = (target.refComponent.state.dependenciesClasses || []).filter((item) => {
        return item !== options.class
      })
      if (state) {
        newStateClasses.push(options.class)
      }
      target.ref.parentNode.parentNode && target.refComponent.setState({ dependenciesClasses: newStateClasses })
    },
    updateSectionDependenciesClasses: (state, target, options, element) => {
      let newStateClasses = (target.refComponent.state.sectionDependenciesClasses || []).filter((item) => {
        return item !== options.class
      })
      if (state) {
        newStateClasses.push(options.class)
      }
      target.ref.parentNode.parentNode && target.refComponent.setState({ sectionDependenciesClasses: newStateClasses })
    },
    fieldMethod: (state, target, options, element) => {
      if (
        target.field && target.field.refDomComponent &&
        target.field.refDomComponent.refs &&
        target.field.refDomComponent.refs.domComponent &&
        target.field.refDomComponent.refs.domComponent[ options.method ]
      ) {
        target.field.refDomComponent.refs.domComponent[ options.method ]()
      }
    },
    tabMethod: (state, target, options, element) => {
      if (
        target.tab && target.tab.refDomComponent &&
        target.tab.refDomComponent.refs &&
        target.tab.refDomComponent.refs.domComponent &&
        target.tab.refDomComponent.refs.domComponent[ options.method ]
      ) {
        target.tab.refDomComponent.refs.domComponent[ options.method ]()
      }
    },
    preset: (state, target, options) => {
    },
    loadLibrary: (state, target, options, element) => {
      if (!vcCake.env('ELEMENT_PUBLIC_JS_FILES')) {
        return
      }

      // TODO change for more complex attributes (dropdown with multiple libraries)
      const library = options.libraries[ 0 ]

      if (state) {
        vcCake.getStorage('assets').trigger('addElementLibrary', element, library)
      } else {
        vcCake.getStorage('assets').trigger('removeElementLibrary', element, library)
      }
    }
  }
}

vcCake.addService('actions-manager', ActionsManager)
