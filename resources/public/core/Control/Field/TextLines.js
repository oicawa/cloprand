define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Locale = require("core/Locale");
  var Class = require("core/Class");
  var Inherits = require("core/Inherits");
  var Field = require("core/Control/Field/Field");
  var Text = require("core/Control/Field/Text");

  function TextLines() {
    Field.call(this, "core/Control/Text", "TextLines");
    this._textarea = null;
    this._value = null;
  }
  Inherits(TextLines, Text);

  TextLines.prototype.template = function() {
    return '<label></label><div><textarea style="color:black;width:400px;height:100px;"/><div name="button"/></div>';
  };

  TextLines.prototype.create_form = function(root, field_name) {
    this._input = root.find('textarea');
    this._input.attr("name", field_name);
    this._input.css("width", this._properties.width + "px");
    this._input.css("height", this._properties.height + "px");
    this._input.w2field("textarea");
  };

  TextLines.DEFAULT_PROPERTIES = { "width" : 400, "height" : 200, "is_require" : false, "default" : "", "multi_lingualization" : false };
  TextLines.prototype.default_properties = function() {
    return TextLines.DEFAULT_PROPERTIES;
  };
  
  TextLines.prototype.detail_id = function() {
    return Class.TEXTLINES_MULTILINGUALIZATION_ID;
  };

  TextLines.cell_render = function(field) {
    return Text.generate_renderer(TextLines.DEFAULT_PROPERTIES, field);
  };
  
  return TextLines;
}); 
