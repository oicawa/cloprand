define(function (require) { 
  require("jquery");
  require("jsrender");
  var Utils = require("data/Core/Utils");
  var Inherits = require("data/Core/Inherits");
  var Field = require("data/Control/Field/Field");
  
  var TEMPLATE = `
<div class="editor"><label><input type="checkbox" name="{{:name}}" /> {{:description}}<label></div>
<div class="renderer"><input type="checkbox" name="{{:name}}" onclick="return false;" /> {{:description}}</div>
`;
  
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
    var html = self._template.render(field);
    self._root.append(html);
    self._editor = self._root.find("div.editor");
    self._renderer = self._root.find("div.renderer");
  }
  
  function Boolean() {
    Field.call(this, "data/Control/Field", "Boolean");
  	this._root = null;
    this._template = null;
    this._editor = null;
    this._renderer = null;
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
    self._template = $.templates(TEMPLATE);
    create_control(self, field);
    
    dfd.resolve();
    return dfd.promise();
  };

  Boolean.prototype.edit = function(on) {
    if (on) {
      this._editor.show();
      this._renderer.hide();
    } else {
      this._editor.hide();
      this._renderer.show();
    }
  };

  Boolean.prototype.backuped = function() {
    var value = checked(this._editor);
    return checked(this._renderer, value);
  };

  Boolean.prototype.commit = function() {
    var value = checked(this._editor);
    checked(this._renderer, value);
  };

  Boolean.prototype.restore = function() {
    var value = checked(this._renderer);
    checked(this._editor, value);
  };
  
  Boolean.prototype.data = function(value) {
    if (arguments.length == 0) {
      return checked(this._editor);
    } else {
      checked(this._editor, value);
      checked(this._renderer, value);
    }
  };

  return Boolean;
}); 
