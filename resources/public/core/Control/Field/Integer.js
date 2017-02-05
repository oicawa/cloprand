define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Locale = require("core/Locale");
  var Inherits = require("core/Inherits");
  var Field = require("core/Control/Field/Field");
  
  var TEMPLATE = '<label></label><div><input style="color:black;"/></div>';
  
  function Integer() {
    Field.call(this, "core/Control/Field", "Integer");
    this._input = null;
    this._value = null;
  };
  Inherits(Integer, Field);
  
  Integer.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    var root = $(selector);

    // Create form tags
    var self = this;
    
    root.append(TEMPLATE);
    var label = root.find("label");
    var caption = Locale.translate(field.label);
    label.text(caption);
    self._input = root.find("input");
    self._input.attr("name", field.name);
    
    var autoFormat = (field.datatype.properties && field.datatype.properties.autoFormat) ? field.datatype.properties.autoFormat : false;
    self._input.w2field("int", { autoFormat: autoFormat });
    
    dfd.resolve();
    return dfd.promise();
  };

  Integer.prototype.backuped = function() {
    return this._value;
  };

  Integer.prototype.commit = function() {
    this._value = this._input.val();
  };

  Integer.prototype.restore = function() {
    this._input.val(this._value);
  };

  Integer.prototype.edit = function(on) {
    this._input.attr("readonly", !on);
  };

  Integer.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._input.val();
    } else {
      this._input.val(value);
      this._value = value;
    }
  };
  
  return Integer;
}); 
