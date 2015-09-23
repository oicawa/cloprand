define(function (require) { 
  var Inherits = require("core/Inherits");
  
  function Control(css_path, template_path, template_name) {
    this._selector = null;
    this._css_path = css_path;
    this._template_path = template_path;
    this._template_name = template_name;
  }
  
  Control.prototype.init = function(selector, field) {
  };

  Control.prototype.update = function(keys) {
  };
  
  return Control;
}); 
