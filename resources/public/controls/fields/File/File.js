define(function (require) { 
  require("jquery");
  require("jsrender");
  var Utils = require("core/Utils");
  var app = require("app");
  
  function File() {
    this._editor = null;
    this._viewer = null;
  };
  
  File.show_editor = function (event) {
    // Get event source information
    var a = $(event.target);
    var file_name = a.text();
    
    var tab = $(event.target).closest("div.tab-panel");
    //var tr = $(event.target).closest("tr");
    //var index = tr.index();
    var tab_id = tab.prop("id");
    var ids = tab_id.split("_");
    var prefix = 0 < ids.length ? ids[0] : null;
    var class_id = 1 < ids.length ? ids[1] : null;
    var object_id = 2 < ids.length ? ids[2] : null;

    // Show FileView
    app.contents().show_tab("FileView", class_id, object_id, file_name, { "file_name" : file_name });
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
      self._viewer.on("click", function(event) {
        File.show_editor(event);
        return false;
      });
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
    if (on && 0 == this._editor.val().length) {
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
