define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Locale = require("core/Locale");
  var Inherits = require("core/Inherits");
  var Field = require("core/Control/Field/Field");
  
  var TEMPLATE = '<label></label><div class="viewer"></div>';
  
  function UUID() {
    Field.call(this, "core/Control/Field", "UUID");
    this._viewer = null;
  }
  Inherits(UUID, Field);

  UUID.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    var root = $(selector);
    var template = $.templates(TEMPLATE);
    var self = this;
    
    root.append(TEMPLATE);
    var label = root.find("label");
    var caption = Locale.translate(field.label);
    label.text(caption);
    self._viewer = root.find("div.viewer");
    
    dfd.resolve();
    return dfd.promise();
  };

  UUID.prototype.edit = function(on) {
    // Do Nothing. UUID can not be edit. (assinged by server side only.)
  };

  UUID.prototype.backuped = function() {
    return this._viewer.text();
  };

  UUID.prototype.commit = function() {
  };

  UUID.prototype.restore = function() {
  };

  UUID.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._viewer.text();
    } else {
      this._viewer.text(value);
    }
  };
  
  return UUID;
}); 
