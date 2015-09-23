define(function (require) { 
  require("jquery");
  require("jsrender");
  var Utils = require("core/Utils");
  var Inherits = require("core/Inherits");
  var Field = require("controls/fields/Field");
  
  function UUID() {
    Field.call(this, "controls/fields", "UUID");
    this._editor = null;
    this._viewer = null;
  }
  Inherits(UUID, Field);

  UUID.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    var root = $(selector);
    var template = null;
    var self = this;
    
    Utils.get_template("controls/fields", "UUID", function(response) { template = $.templates(response); })
    .then(function() {
      var html = template.render(field);
      root.append(html);
      self._editor = root.find("div.editor");
      self._viewer = root.find("div.viewer");
      dfd.resolve();
    });
    return dfd.promise();
  };

  UUID.prototype.edit = function(on) {
    if (on) {
      this._editor.show();
      this._viewer.hide();
    } else {
      this._editor.hide();
      this._viewer.show();
    }
  };

  UUID.prototype.backuped = function() {
    return this._viewer.text();
  };

  UUID.prototype.commit = function() {
    var value = this._editor.text();
    this._viewer.text(value);
  };

  UUID.prototype.restore = function() {
    var value = this._viewer.text();
    this._editor.text(value);
  };

  UUID.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._editor.text();
    } else {
      this._editor.text(value);
      this._viewer.text(value);
    }
  };
  
  return UUID;
}); 
