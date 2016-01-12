define(function (require) { 
  require("jquery");
  require("jsrender");
  var Utils = require("data/Core/Utils");
  var Inherits = require("data/Core/Inherits");
  var Field = require("controls/fields/Field");

  function TextLines() {
    Field.call(this, "controls/fields", "TextLines");
    this._editor = null;
    this._viewer = null;
  }
  Inherits(TextLines, Field);

  TextLines.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    
    var root = $(selector);

    // Load template data & Create form tags
    var template = null;
    var self = this;
    Utils.get_template("controls/fields", "TextLines", function(response) { template = $.templates(response); })
    .then(function() {
      var html = template.render(field);
      root.append(html);
      
      self._editor = root.children("textarea");
      self._viewer = root.children("pre");
      
      dfd.resolve();
    });
    return dfd.promise();
  };

  TextLines.prototype.edit = function(on) {
    if (on) {
      this._editor.show();
      this._viewer.hide();
    } else {
      this._editor.hide();
      this._viewer.show();
    }
  };

  TextLines.prototype.backuped = function() {
    return this._viewer.text();
  };

  TextLines.prototype.commit = function() {
    var value = this._editor.val();
    this._viewer.text(value);
  };

  TextLines.prototype.restore = function() {
    var value = this._viewer.text();
    this._editor.val(value);
  };

  TextLines.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._editor.val();
    } else {
      this._editor.val(value);
      this._viewer.text(value);
    }
  };
  
  return TextLines;
}); 
