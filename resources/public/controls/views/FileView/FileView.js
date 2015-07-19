define(function (require) {
  require("jquery");
  require("jquery_splitter");
  require("jsrender");
  var Utils = require("core/Utils");
  var Toolbar = require("controls/Toolbar/Toolbar");
  var Detail = require("controls/Detail/Detail");
  var Grid = require("controls/Grid/Grid");
  var Tabs = require("controls/Tabs/Tabs");
  var Contents = require("Contents");
  var app = require("app");

  function edit_toolbar(toolbar, on) {
    if (on) {
      toolbar.button("edit").hide();
      toolbar.button("delete").hide();
      toolbar.button("save").show();
      toolbar.button("cancel").show();
    } else {
      toolbar.button("edit").show();
      toolbar.button("delete").show();
      toolbar.button("save").hide();
      toolbar.button("cancel").hide();
    }
  };

  function FileView () {
    this._class_id = null;
    this._object_id = null;
    this._class = null;
    this._object = null;
    this._toolbar = null;
    this._detail = null;
  }
  
  FileView.edit = function (event) {
    var tab_info = Contents.get_tab_info(event);
    var view = app.contents().content(tab_info.tab_id);
    view.detail().edit(true);
    edit_toolbar(view.toolbar(), true);
  };
  
  FileView.delete = function (event) {
    var res = confirm("Delete this class?");
    if (!res) {
      return;
    }
    
    var tab_info = Contents.get_tab_info(event);
    var objects = null;
    Utils.delete_data(tab_info.class_id, tab_info.object_id, function(response) { objects = response; })
    .then(function() {
      alert("Deleted");
      app.contents().remove(tab_info.tab_id);
      app.contents().broadcast(tab_info.class_id, tab_info.object_id, null);
    });
  };

  FileView.save = function (event) {
    var tab_info = Contents.get_tab_info(event);
    var view = app.contents().content(tab_info.tab_id);
    var detail = view.detail();
    var data = detail.data();
    var object = null;
    if (detail.is_new()) {
      Utils.post_data(tab_info.class_id, data, function(response) { object = response;})
      .then(function() {
        edit_toolbar(view.toolbar(), false);
        detail.edit(false);
        detail.data(object);
        var old_tab_id = tab_info.tab_id;
        var new_tab_id = Contents.tab_id(tab_info.prefix, tab_info.class_id, object.uuid);
        app.contents().change(old_tab_id, new_tab_id, object.label);
        app.contents().broadcast(tab_info.class_id, object.uuid, object);
        alert("Saved");
      });
    } else {
      if (!data.uuid)
        data.uuid = tab_info.object_id;
      Utils.put_data(tab_info.class_id, data.uuid, data, function(response) { object = response; })
      .then(function() {
        edit_toolbar(view.toolbar(), false);
        detail.edit(false);
        detail.commit();
        app.contents().label(tab_info.tab_id, data.label);
        app.contents().broadcast(tab_info.class_id, tab_info.object_id, data);
        alert("Saved");
      });
    }
  };
  
  FileView.cancel = function (event, li) {
    if (!confirm("Canceled?")) {
      return;
    }
    var tab_info = Contents.get_tab_info(event);
    var view = app.contents().content(tab_info.tab_id);
    edit_toolbar(view.toolbar(), false);
    var detail = view.detail();
    detail.restore();
    detail.edit(false);
  };
  
  FileView.prototype.detail = function () {
    return this._detail;
  };
  
  FileView.prototype.toolbar = function () {
    return this._toolbar;
  };
  
  FileView.prototype.init = function (selector, class_id, object_id, options) {
    this._class_id = class_id;
    this._object_id = object_id;
    this._toolbar = new Toolbar();
    //this._detail = new Detail();
    var view = $(selector)
    var template = null;
    var class_ = null;
    var basic_assist = null;
    var custom_assist = null;
    var object = null;
    var file_contents = null;
    var self = this;
    
    var default_toolbar = {
      "items" : [
        { "name": "save",   "caption": "Save",   "description": "Save item data.", "operation": "save" }
        ,{ "name": "cancel", "caption": "Cancel", "description": "Cancel item data.", "operation": "cancel" }
        ,{ "name": "delete", "caption": "Delete", "description": "Delete item data.", "operation": "delete" }
      ]
    };
    var toolbar_selector = selector + "> div.fileview-panel > div.file-operations";
    var detail_selector = selector + "> div.fileview-panel > div.file-contents";
    
    function get_object_data(self, class_id_, object_id_) {
      if (object_id_ == Utils.NULL_UUID) {
        console.log("Didn't call Utils.get_data method to get object data.");
        var dfd = new $.Deferred;
        dfd.resolve();
        return dfd.promise();
      }

      return Utils.get_data(class_id_, object_id_, function (data) {
        self._object = data;
      });
    }

    Utils.add_css("/controls/views/FileView/FileView.css");
    $.when(
      Utils.get_template("controls/views", "FileView", function (data) { template = $.templates(data); })
      ,Utils.get_file(class_id, "FileView.json", "json", function (data) { basic_assist = data; }, function(data) { return true; })
      ,Utils.get_extension(class_id, object_id, options.file_name, function (data) { file_contents = data; })
    ).then(function() {
      var view_html = template.render(file_contents);
      view.append(view_html);

      self._class = class_;

      $.when(
        self._toolbar.init(toolbar_selector, default_toolbar)
      ).then(function() {
        self._toolbar.bind("save", FileView.save);
        self._toolbar.bind("cancel", FileView.cancel);
        self._toolbar.bind("delete", FileView.delete);
        self._toolbar.visible(true);
      });
    });
  };

  return FileView;
});
