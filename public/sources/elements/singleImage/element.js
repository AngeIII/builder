window.vcvAddElement(
  {"name":{"type":"string","access":"protected","value":"Single Image"},"category":{"type":"string","access":"protected","value":"Content"},"metaIntro":{"type":"textarea","access":"protected","value":"Short intro"},"metaDescription":{"type":"textarea","access":"protected","value":"Long description"},"metaPreviewDescription":{"type":"textarea","access":"protected","value":"Medium preview description"},"metaPreview":{"type":"attachimage","access":"protected","value":"preview.png"},"metaThumbnail":{"type":"attachimage","access":"protected","value":"thumbnail.png"},"metaIcon":{"type":"attachimage","access":"protected","value":"icon.png"},"image":{"type":"attachimage","access":"public","value":"http://alpha.visualcomposer.io/wp-content/uploads/2016/05/hero.png","options":{"label":"Image","multiple":false}},"style":{"type":"dropdown","access":"public","value":"","options":{"label":"Style","values":[{"label":"Default","value":""},{"label":"Rounded","valye":"vc_box_rounded"},{"label":"Border","valye":"vc_box_border"},{"label":"Outline","valye":"vc_box_outline"},{"label":"Shadow","valye":"vc_box_shadow"},{"label":"Round","valye":"vc_box_circle"}]}},"editFormTab1":{"type":"group","access":"protected","value":["image","style"],"options":{"label":"Element"}},"editFormTabs":{"type":"group","access":"protected","value":["editFormTab1"]},"relatedTo":{"type":"group","access":"protected","value":["General"]},"tag":{"access":"protected","type":"string","value":"singleImage"}},
  // Component callback
  function(component) {
	
    component.add(React.createClass({
      render: function() {
        // import variables
        var {id, content, atts, editor} = this.props
var {image, style} = atts

        // import template js
        
        // import template
        return (<img src={image}  {...editor}/>
);
      }
    }));
  },
  // css settings // css for element
  {},
  // javascript callback
  function(){},
  // editor js
  null
);
