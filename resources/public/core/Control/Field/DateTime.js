define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Locale = require("core/Locale");
  var Inherits = require("core/Inherits");
  var Field = require("core/Control/Field/Field");
  
  var TEMPLATE = '<div><input style="color:black;"/></div>';
  
  function DateTime() {
    Field.call(this, "core/Control/Field", "DateTime");
    this._input = null;
    this._value = null;
  };
  Inherits(DateTime, Field);
  
  DateTime.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    var root = $(selector);

    // Create form tags
    var self = this;
    
    root.append(TEMPLATE);
    self._input = root.find("input");
    self._input.attr("name", field.name);
    self._input.w2field("date");
    
    dfd.resolve();
    return dfd.promise();
  };

  DateTime.prototype.backuped = function() {
    return this._value;
  };

  DateTime.prototype.commit = function() {
    this._value = this._input.val();
  };

  DateTime.prototype.restore = function() {
    this._input.val(this._value);
  };

  DateTime.prototype.edit = function(on) {
    this._input.attr("readonly", !on);
  };

  DateTime.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._input.val();
    } else {
      this._input.val(value);
      this._value = value;
    }
  };
  
  return DateTime;
}); 
