define(function (require) { 
  require("jquery");
  require("jsrender");
  var Utils = require("core/Utils");
  
  function File() {
    this._editor = null;
    this._viewer = null;
  };
  
  File.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    var root = $(selector);
    if (0 < root.children()) {
      dfd.resolve();
      return dfd.promise();
    }

    // Load template data & Create form tags
    var template = null;
    var self = this;
    Utils.get_template("controls/fields", "File", function(response) { template = $.templates(response); })
    .then(function() {
      var html = template.render(field);
      root.append(html);
      self._editor = root.find("input.editor");
      self._viewer = root.find("a.viewer");
      dfd.resolve();
    });
    return dfd.promise();
  };

  File.prototype.backuped = function() {
    return this._viewer.text();
  };

  File.prototype.commit = function() {
    var value = this._editor.val();
    this._viewer.text(value);
  };

  File.prototype.restore = function() {
    var value = this._viewer.text();
    this._editor.val(value);
  };

  File.prototype.edit = function(on) {
    if (on) {
      this._editor.show();
      this._viewer.hide();
    } else {
      this._editor.hide();
      this._viewer.show();
    }
  };

  File.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._editor.val();
    } else {
      this._editor.val(value);
      this._viewer.text(value);
    }
  };
  
  return File;
}); 
