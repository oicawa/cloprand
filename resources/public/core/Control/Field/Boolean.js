define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Locale = require("core/Locale");
  var Inherits = require("core/Inherits");
  var Field = require("core/Control/Field/Field");
  
  var TEMPLATE = '' +
'<label></label>' +
'<div><label><input type="checkbox" /><span></span></label></div>';
  
  function parse_value(value) {
    // false, 0, null, undefined
    if (!value) {
      return false;
    }
    // Exist some type data (without string)
    if (typeof value != 'string') {
      return true;
    }
    // parse string data
    if (value == "" || value == "0" || value.toLowerCase() == "false") {
      return false;
    } else {
      return true;
    }
  }

  function checked(control, value) {
    if (arguments.length == 1) {
      var val = control.find("input").prop("checked");
      return parse_value(val);
    }
    if (arguments.length != 2) {
      cosole.assert("argument length is illegal.");
      return;
    }
    control.find("input").prop("checked", parse_value(value));
  }

  function create_control(self, field) {
    self._root.append(TEMPLATE);
    
    var label = self._root.children("label");
    var caption = Locale.translate(field.label);
    label.text(caption);
    
    var description = self._root.find("span");
    description.text(Locale.translate(field.description));
    
    self._checkbox = self._root.find("input[type='checkbox']");
  }
  
  function Boolean() {
    Field.call(this, "core/Control/Field", "Boolean");
    this._root = null;
    this._checkbox = null;
    this._value = null;
  };
  Inherits(Boolean, Field);

  Boolean.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    // Set member fields
    this._root = $(selector);
    if (0 < this._root.children()) {
      dfd.resolve();
      return dfd.promise();
    }
    var self = this;
    
    // Create form tags
    create_control(self, field);
    
    dfd.resolve();
    return dfd.promise();
  };

  Boolean.prototype.edit = function(on) {
    if (on) {
      this._checkbox.removeAttr("onclick");
    } else {
      this._checkbox.attr("onclick", "return false;");
    }
  };

  Boolean.prototype.backuped = function() {
    return this._value;
  };

  Boolean.prototype.commit = function() {
    this._value = this._checkbox.prop("checked");
  };

  Boolean.prototype.restore = function() {
    this._checkbox.prop("checked", this._value);
  };
  
  Boolean.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._checkbox.prop("checked");
    } else {
      this._checkbox.prop("checked", value);
      this._value = value;
    }
  };

  Boolean.renderer = function(field) {
    var dfd = new $.Deferred;
    var renderer = function(record, index, column_index) {
      var value = record[field.name];
      var fa = !value ? "fa-square-o" :  "fa-check-square-o";
      return '<i style="display:table-cell;text-align:center;vertical-align:middle;padding:5px;" class="fa ' + fa + ' fa-fw"></i>';
    };
    dfd.resolve(renderer);
    return dfd.promise();
  };

  return Boolean;
}); 
