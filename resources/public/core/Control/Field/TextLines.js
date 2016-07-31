define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Inherits = require("core/Inherits");
  var Field = require("core/Control/Field/Field");
  
  var TEMPLATE = '<label></label><div><textarea style="color:black; width:500px; height: 100px;"/></div>';
  

  function TextLines() {
    Field.call(this, "core/Control/Field", "TextLines");
    this._textarea = null;
    this._value = null;
  }
  Inherits(TextLines, Field);

  TextLines.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    var root = $(selector);
    var self = this;

    // Create form tags
    root.append(TEMPLATE);
    
    self._textarea = root.find("textarea");
    var label = root.find("label");
    var caption = field.label;
    label.text(caption);
      
    dfd.resolve();
    return dfd.promise();
  };

  TextLines.prototype.edit = function(on) {
    this._textarea.attr("readonly", !on);
  };

  TextLines.prototype.backuped = function() {
    return this._value;
  };

  TextLines.prototype.commit = function() {
    this._value = this._textarea.val();
  };

  TextLines.prototype.restore = function() {
    this._textarea.val(this._value);
  };

  TextLines.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._textarea.val();
    } else {
      this._textarea.val(value);
      this._value = value;
    }
  };
  
  return TextLines;
}); 
