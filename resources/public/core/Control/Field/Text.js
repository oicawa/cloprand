define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Inherits = require("core/Inherits");
  var Field = require("core/Control/Field/Field");
  
  var TEMPLATE = '<label></label><div><input style="color:black;"/></div>';
  
  function Text() {
    Field.call(this, "core/Control/Field", "Text");
    this._input = null;
    this._value = null;
  };
  Inherits(Text, Field);
  
  Text.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    var root = $(selector);

    // Create form tags
    var self = this;
    
    root.append(TEMPLATE);
    var label = root.find("label");
    var caption = field.label;
    label.text(caption);
    self._input = root.find("input");
    self._input.attr("name", field.name);
    self._input.w2field("text");
    
    dfd.resolve();
    return dfd.promise();
  };

  Text.prototype.backuped = function() {
    return this._value;
  };

  Text.prototype.commit = function() {
    this._value = this._input.val();
  };

  Text.prototype.restore = function() {
    this._input.val(this._value);
  };

  Text.prototype.edit = function(on) {
    this._input.attr("readonly", !on);
  };

  Text.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._input.val();
    } else {
      this._input.val(value);
      this._value = value;
    }
  };
  
  return Text;
}); 
