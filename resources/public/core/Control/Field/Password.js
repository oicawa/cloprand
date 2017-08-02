define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Locale = require("core/Locale");
  var Inherits = require("core/Inherits");
  var Field = require("core/Control/Field/Field");
  
  var TEMPLATE = '<div><input style="color:black;" type="password"/></div>';
  
  function Password() {
    Field.call(this, "core/Control/Field", "Password");
    this._input = null;
    this._value = null;
  };
  Inherits(Password, Field);
  
  Password.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    var root = $(selector);

    // Create form tags
    var self = this;
    
    root.append(TEMPLATE);
    self._input = root.find("input");
    self._input.attr("name", field.name);
    self._input.w2field("text");
    
    dfd.resolve();
    return dfd.promise();
  };

  Password.prototype.backuped = function() {
    return this._value;
  };

  Password.prototype.commit = function() {
    this._value = this._input.val();
  };

  Password.prototype.restore = function() {
    this._input.val(this._value);
  };

  Password.prototype.edit = function(on) {
    this._input.attr("readonly", !on);
  };

  Password.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._input.val();
    } else {
      this._input.val(value);
      this._value = value;
    }
  };
  
  return Password;
}); 
