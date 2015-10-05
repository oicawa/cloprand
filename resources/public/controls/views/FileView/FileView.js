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
      toolbar.button("save").show();
      toolbar.button("cancel").show();
      toolbar.button("delete").hide();
    } else {
      toolbar.button("save").hide();
      toolbar.button("cancel").hide();
      toolbar.button("delete").show();
    }
  };

  function FileView () {
    this._class_id = null;
    this._object_id = null;
    this._class = null;
    this._object = null;
    this._toolbar = null;
    this._file_name = null;
    this._file_contents = null;
    this._textarea_selector = null;
  }
  
  FileView.delete = function (event) {
    var res = confirm("Delete this extension?");
    if (!res) {
      return;
    }
    
    var tab_info = Contents.get_tab_info(event);
    var view = app.contents().content(tab_info.tab_id);
    var file_name = view.file_name();
    var objects = null;
    Utils.delete_extension(tab_info.class_id, tab_info.object_id, file_name, function(response) { objects = response; })
    .then(function() {
      alert("Deleted");
      app.contents().remove(tab_info.tab_id);
      app.contents().broadcast(tab_info.class_id, tab_info.object_id, null);
    });
  };

  FileView.save = function (event) {
    var tab_info = Contents.get_tab_info(event);
    var view = app.contents().content(tab_info.tab_id);
    //var file_contents = view.file_contents();
    var file_contents = $(view._textarea_selector);
    var data = file_contents.val();
    var object = null;
    var file_name = view.file_name();
    if (!file_name || file_name == "") {
      file_name = prompt("Input extension file name.");
      if (!file_name || file_name == "") {
        alert("To save this contents as a new extension file,\nthe file name is required.");
        return;
      }
      Utils.post_extension(tab_info.class_id, tab_info.object_id, file_name, data, function(response) { object = response;})
      .then(function() {
        var current_tab_id = tab_info.tab_id;
        var new_tab_id = current_tab_id + "_" + file_name;
        app.contents().label(current_tab_id, file_name);
        app.contents().change(current_tab_id, new_tab_id, object.file_name);
        app.contents().broadcast(tab_info.class_id, object.id, object);
        alert("Saved");
      });
    } else {
      Utils.put_extension(tab_info.class_id, tab_info.object_id, file_name, data, function(response) { object = response; })
      .then(function() {
        //edit_toolbar(view.toolbar(), false);
        //detail.edit(false);
        //detail.commit();
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
  
  FileView.prototype.file_name = function () {
    return this._file_name;
  };
  
  FileView.prototype.file_contents = function () {
    return this._file_contents;
  };
  
  FileView.prototype.toolbar = function () {
    return this._toolbar;
  };
  
  FileView.prototype.init = function (selector, class_id, object_id, options) {
    this._class_id = class_id;
    this._object_id = object_id;
    this._toolbar = new Toolbar();
    this._file_name = options.file_name;
    //this._detail = new Detail();
    var view = $(selector)
    var template = null;
    var class_ = null;
    var basic_assist = null;
    var custom_assist = null;
    var object = null;
    var self = this;
    
    var default_toolbar = {
      "items" : [
        { "name": "save",   "caption": "Save",   "description": "Save item data.", "operation": "save" }
        ,{ "name": "cancel", "caption": "Cancel", "description": "Cancel item data.", "operation": "cancel" }
        ,{ "name": "delete", "caption": "Delete", "description": "Delete item data.", "operation": "delete" }
      ]
    };
    var toolbar_selector = selector + "> div.fileview-panel > div.file-operations";
    var file_contents_selector = selector + "> div.fileview-panel > div.file-contents > textarea";
    this._textarea_selector = selector + "> div.fileview-panel > div.file-contents > textarea";
    this._file_contents = $(file_contents_selector);
    var file_contents = null;
    
    function get_extension_data(self, class_id_, object_id_, file_name) {
      if (!file_name) {
        console.log("Didn't call Utils.get_extension method to get object data.");
        file_contents = "";
        var dfd = new $.Deferred;
        dfd.resolve();
        return dfd.promise();
      }

      return Utils.get_extension(class_id_, object_id_, file_name, function (data) {
        file_contents = data.file_contents;
      });
    }

    Utils.add_css("/controls/views/FileView/FileView.css");
    $.when(
      Utils.get_template("controls/views", "FileView", function (data) { template = $.templates(data); })
      ,Utils.get_file(class_id, "FileView.json", "json", function (data) { basic_assist = data; }, function(data) { return true; })
      ,get_extension_data(self, class_id, object_id, options.file_name)
    ).then(function() {
      var view_html = template.render();
      view.append(view_html);
      
      $(self._textarea_selector).val(file_contents);

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
