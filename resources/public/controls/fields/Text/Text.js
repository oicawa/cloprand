define(function (require) { 
  require("jquery");
  require("jsrender");
  var Utils = require("data/Core/Utils");
  var Inherits = require("data/Core/Inherits");
  var Field = require("controls/fields/Field");
  
  function Text() {
    Field.call(this, "controls/fields", "Text");
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

    // Load template data & Create form tags
    var template = null;
    var self = this;
    Utils.get_template("controls/fields", "Text", function(response) { template = $.templates(response); })
    .then(function() {
      var html = template.render(field);
      root.append(html);
      self._editor = root.find("input");
      self._viewer = root.find("div");
      dfd.resolve();
    });
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
