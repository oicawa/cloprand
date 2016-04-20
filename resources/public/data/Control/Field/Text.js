define(function (require) { 
  require("jquery");
  var Utils = require("data/Core/Utils");
  var Inherits = require("data/Core/Inherits");
  var Field = require("data/Control/Field/Field");
  
  var TEMPLATE = '' +
'<input type="text" value=""/>' +
'<div></div>';
  
  function Text() {
    Field.call(this, "data/Control/Field", "Text");
    this._editor = null;
    this._viewer = null;
  };
  Inherits(Text, Field);
  
  Text.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    var root = $(selector);
    if (0 < root.children()) {
      dfd.resolve();
      return dfd.promise();
    }

    // Create form tags
    var self = this;
    root.append(TEMPLATE);
    self._editor = root.find("input");
    self._viewer = root.find("div");
    
    self._editor.attr("name", field.name);
    
    dfd.resolve();
    return dfd.promise();
  };

  Text.prototype.backuped = function() {
    return this._viewer.text();
  };

  Text.prototype.commit = function() {
    var value = this._editor.val();
    this._viewer.text(value);
  };

  Text.prototype.restore = function() {
    var value = this._viewer.text();
    this._editor.val(value);
  };

  Text.prototype.edit = function(on) {
    if (on) {
      this._editor.show();
      this._viewer.hide();
    } else {
      this._editor.hide();
      this._viewer.show();
    }
  };

  Text.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._editor.val();
    } else {
      this._editor.val(value);
      this._viewer.text(value);
    }
  };
  
  return Text;
}); 
