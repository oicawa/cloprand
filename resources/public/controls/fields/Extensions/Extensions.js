define(function (require) { 
  require("jquery");
  require("jsrender");
  var Utils = require("core/Utils");
  var Toolbar = require("controls/Toolbar/Toolbar");
  var Grid = require("controls/Grid/Grid");
  var app = require("app");

  var default_toolbar = {
    "operations" : "ae727055-cb09-49ed-84af-6cbc8cd37ba8/operations",
    "items" : [
      { "name": "add",    "caption": "Add",    "description": "Add new field", "operation": "add" },
      { "name": "edit",   "caption": "Edit",   "description": "Edit field",    "operation": "edit" },
    ]
  };

  function assign_ids(self) {
  	console.assert(self);
  	if (!self._root)
  	  return;
    var tab = self._root.closest("div.tab-panel");
    var tab_id = tab.prop("id");
    var ids = tab_id.split("_");
    var prefix = 0 < ids.length ? ids[0] : null;
    self._class_id = 1 < ids.length ? ids[1] : null;
    self._object_id = 2 < ids.length ? ids[2] : null;
  }

  Extensions.prototype.is_new = function() {
    assign_ids(this);
    console.log("this._object_id = " + this._object_id);
  	if (!this._object_id)
  	  return true;
  	if (this._object_id == Utils.NULL_UUID)
  	  return true;
    return false;
  }

  function show_fileview(data) {
    alert("Show FileView.\n" + data);
  }

  function Extensions() {
    this._root = null;
    this._class_id = null;
    this._object_id = null;
    this._toolbar = null;
    this._grid = null;
    this._data = null;
    this._backuped = null;
  };

  Extensions.show_editor = function (event) {
    var tab = $(event.target).closest("div.tab-panel");
    var tr = $(event.target).closest("tr");
    var index = tr.index();
    var file_name = null;
    if (index <= 0) {
      var td = $(event.target).closest("td");
      file_name = td.text();
    }
    var tab_id = tab.prop("id");
    var ids = tab_id.split("_");
    var prefix = 0 < ids.length ? ids[0] : null;
    var class_id = 1 < ids.length ? ids[1] : null;
    var object_id = 2 < ids.length ? ids[2] : null;

    // Show FileView
    app.contents().show_tab("FileView", class_id, object_id, file_name == null ? "New Extension" : file_name, { "file_name" : file_name });
  };

  function init_template(self) {
    var dfd = new $.Deferred;
    var template = null;
    Utils.get_template("controls/fields", "Extensions", function(response) { template = $.templates(response); })
    .then(function() {
      var html = template.render();
      self._root.append(html);
      dfd.resolve();
    });
    return dfd.promise();
  }

  function init_grid(selector, self) {
    var dfd = new $.Deferred;
    var extensions = null;
    self._grid = new Grid();
    $.when(
      Utils.get_extension(self._class_id, self._object_id, null, function (data) { extensions = data; })
      ,self._grid.init(selector + " > div.extensions", [{name: "file_name", label: "Extension File Name", renderer: null}])
    ).always(function() {
      self._grid.data(extensions);
      dfd.resolve();
    });
    return dfd.promise();
  }

  function init_toolbar(selector, self, toolbar) {
    var dfd = new $.Deferred;
    self._toolbar = new Toolbar();
    self._toolbar.init(selector + " > div.toolbar", toolbar)
    .then(function() {
      self._toolbar.bind("add", function(event) {
        Extensions.show_editor(event);
      });
      self._toolbar.bind("edit", function(event) {
        var index = self._grid.selected_index();
        if (index < 0) {
          alert("Select item.");
          return;
        }
        var data = self._grid.data()[index];
        Extensions.show_editor(event);
      });
      self._toolbar.visible(false);
      dfd.resolve();
    });
    return dfd.promise();
  }
  
  Extensions.prototype.init = function(selector, field, assist) {
    var dfd = new $.Deferred;
    this._root = $(selector);
  	assign_ids(this);
    if (0 < this._root.children()) {
      dfd.resolve();
      return dfd.promise();
    }

    // Load template data & Create form tags
    var template = null;
    var class_ = null;
    var self = this;
    var toolbar = !assist ? default_toolbar : (!assist.toolbar ? default_toolbar : assist.toolbar);
    
    init_template(self)
    .then(function() { return init_grid(selector, self); })
    .then(function() { return init_toolbar(selector, self, toolbar); })
    .then(function() { dfd.resolve(); });
    return dfd.promise();
  };

  Extensions.prototype.backuped = function() {
    return this._backuped;
  };

  Extensions.prototype.commit = function() {
    return;
  };

  Extensions.prototype.restore = function() {
    return;
  };

  Extensions.prototype.edit = function(on) {
    if (!on) {
      this._toolbar.visible(false);
      return;
    }
    if (this.is_new()) {
      this._toolbar.visible(false);
      return;
    }
    this._toolbar.visible(on);
  };

  Extensions.prototype.data = function(values) {
    if (arguments.length == 0) {
      return null;
    } else {
      this._grid.data(values);
      this._backuped = values;
    }
  };
  
  return Extensions;
}); 
