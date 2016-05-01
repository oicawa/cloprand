define(function (require) {
  require("jquery");
  var app = require("app");
  var Utils = require("data/Core/Utils");
  var Uuid = require("data/Core/Uuid");
  var Connector = require("data/Core/Connector");
  var Contents = require("data/Core/Contents");
  var Toolbar = require("data/Control/Toolbar");
  var Detail = require("data/Control/Detail");
  //var Grid = require("data/Control/Grid");
  var Tabs = require("data/Control/Tabs");
  var Dialog = require("data/Core/Dialog");

  var TEMPLATE = '' +
'<div class="detailview-panel">' +
'  <div class="object-operations"></div>' +
'  <div class="object-detail"></div>' +
'</div>';

  function edit_toolbar(toolbar, on) {
    if (on) {
      toolbar.hide("edit");
      toolbar.hide("delete");
      toolbar.show("save");
      toolbar.show("cancel");
    } else {
      toolbar.show("edit");
      toolbar.show("delete");
      toolbar.hide("save");
      toolbar.hide("cancel");
    }
  };

  function DetailView () {
    this._class_id = null;
    this._object_id = null;
    this._class = null;
    this._object = null;
    this._toolbar = null;
    this._detail = null;
  }
  
  DetailView.edit = function (event) {
    var tab_info = Contents.get_tab_info(event);
    var view = app.contents().content(tab_info.tab_id);
    view.detail().edit(true);
    edit_toolbar(view.toolbar(), true);
  };
  
  DetailView.delete = function (event) {
    Dialog.confirm("Delete this class?", function(answer) {
      if (answer == "No") {
        return;
      }
      
      var tab_info = Contents.get_tab_info(event);
      var objects = null;
      Connector.crud.delete("api/" + tab_info.class_id + "/" + tab_info.object_id, function(response) { objects = response; })
      .then(function() {
        Dialog.show("Deleted", "Delete");
        app.contents().remove(tab_info.tab_id);
        app.contents().broadcast(tab_info.class_id, tab_info.object_id, null);
      });
    });
  };

  DetailView.save = function (event) {
    var tab_info = Contents.get_tab_info(event);
    var view = app.contents().content(tab_info.tab_id);
    var detail = view.detail();
    var data = detail.data();
    var object = null;

    // Get field information
    var fields = detail._class.object_fields;
    var key_field_names = fields.filter(function(field, index) { return !(!field.key); })
                                .map(function(field){ return field.name; });
    var caption_field_names = fields.filter(function(field, index) { return !(!field.caption); })
                                    .map(function(field){ return field.name; });
    console.assert(0 < key_field_names.length, key_field_names);
    console.assert(0 < caption_field_names.length, caption_field_names);
    var key_field_name = key_field_names[0];
    
    if (detail.is_new()) {
      Connector.crud.create("api/" + tab_info.class_id, data, function(response) { object = response;})
      .then(function() {
        edit_toolbar(view.toolbar(), false);
        detail.edit(false);
        detail.data(object);
        var old_tab_name = tab_info.tab_id;
        var new_tab_name = Tabs.create_tab_name([tab_info.prefix, tab_info.class_id, object[key_field_name]]);
        var label = caption_field_names.map(function(name) { return object[name]; }).join(" ");
        app.contents().change(old_tab_name, new_tab_name, label);
        app.contents().broadcast(tab_info.class_id, object[key_field_name], object);
        Dialog.show("New item was created successfully.", "Save");
      });
    } else {
      if (!data[key_field_name])
        data[key_field_name] = tab_info.object_id;
      Connector.crud.update("api/" + tab_info.class_id + "/" + data[key_field_name], data, function(response) { object = response; })
      .then(function() {
        edit_toolbar(view.toolbar(), false);
        detail.edit(false);
        detail.commit();
        var label = caption_field_names.map(function(name) { return data[name]; }).join(" ");
        app.contents().label(tab_info.tab_id, label);
        app.contents().broadcast(tab_info.class_id, tab_info.object_id, data);
        Dialog.show("Edited item was saved successfully.", "Save");
      });
    }
  };
  
  DetailView.cancel = function (event, li) {
    Dialog.confirm("Canceled?", function(answer) {
      if (answer == "No") {
        return;
      }
      
      var tab_info = Contents.get_tab_info(event);
      var view = app.contents().content(tab_info.tab_id);
      edit_toolbar(view.toolbar(), false);
      var detail = view.detail();
      detail.restore();
      detail.edit(false);
    });
  };
  
  DetailView.prototype.detail = function () {
    return this._detail;
  };
  
  DetailView.prototype.toolbar = function () {
    return this._toolbar;
  };

  function update_self_data(self, keys) {
    var target = false;
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key.class_id != self._class_id) {
        continue;
      }
      if (key.object_id != self._object_id) {
        continue;
      }
      target = true;
      break;
  	}

  	if (!target) {
  	  return;
  	}

    Connector.crud.read("api/" + self._class_id + "/" + self._object_id, "json", function (data) { self._object = data; })
    .then(function () {
      self._detail.data(self._object);
    });
  }
  
  DetailView.prototype.update = function (keys) {
    update_self_data(this, keys);
    this._detail.update(keys);
  };
  
  DetailView.prototype.refresh = function () {
    this._detail.refresh();
  };
  
  DetailView.prototype.init = function (selector, class_id, object_id) {
    this._class_id = class_id;
    this._object_id = object_id;
    this._toolbar = new Toolbar();
    this._detail = new Detail();
    var view = $(selector);
    var class_ = null;
    var basic_assist = null;
    var custom_assist = null;
    var object = null;
    var self = this;
    
    var default_toolbar = {
      "items" : [
        { "name": "edit",   "caption": "Edit",   "description": "Edit item data.", "operation": "edit" },
        { "name": "delete", "caption": "Delete", "description": "Delete item data.", "operation": "delete" },
        { "name": "save",   "caption": "Save",   "description": "Save item data.", "operation": "save" },
        { "name": "cancel", "caption": "Cancel", "description": "Cancel item data.", "operation": "cancel" }
      ]
    };
    var toolbar_selector = selector + "> div.detailview-panel > div.object-operations";
    var detail_selector = selector + "> div.detailview-panel > div.object-detail";
    
    function get_object_data(self, class_id_, object_id_) {
      if (object_id_ == Uuid.NULL) {
        console.log("Didn't call Connector.crud.read method to get object data.");
        var dfd = new $.Deferred;
        dfd.resolve();
        return dfd.promise();
      }

      return Connector.crud.read("api/" + class_id_ + "/" + object_id_, "json", function (data) {
        self._object = data;
      });
    }
    Utils.load_css("/data/Style/View/DetailView.css");
    $.when(
      Connector.crud.read("api/" + Utils.CLASS_ID + "/" + class_id, "json", function (data) { class_ = data; }),
      //Utils.get_file(class_id, "DetailView.json", "json", function (data) { basic_assist = data; }, function(data) { return true; }),
      //Utils.get_file(class_id, "CustomAssist.json", "json", function (data) { custom_assist = data; }, function(data) { return true; }),
      get_object_data(self, class_id, object_id)
    ).then(function() {
      view.append(TEMPLATE);

      self._class = class_;

      $.when(
        self._toolbar.init(toolbar_selector, default_toolbar),
        self._detail.init(detail_selector, self._class, basic_assist, custom_assist)
      ).then(function() {
        self._toolbar.bind("edit", DetailView.edit);
        self._toolbar.bind("delete", DetailView.delete);
        self._toolbar.bind("save", DetailView.save);
        self._toolbar.bind("cancel", DetailView.cancel);
        self._detail.visible(true);
        if (self._object_id == Utils.NULL_UUID) {
          edit_toolbar(self._toolbar, true);
          self._detail.edit(true);
        } else {
          edit_toolbar(self._toolbar, false);
          self._detail.edit(false);
          self._detail.data(self._object);
        }
        self._toolbar.visible(true);
        self.refresh();
      });
    });
  };

  return DetailView;
});
