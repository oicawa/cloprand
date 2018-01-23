define(function (require) {
  require("jquery");
  var app = require("app");
  var Utils = require("core/Utils");
  var Uuid = require("core/Uuid");
  var Class = require("core/Class");
  var Storage = require("core/Storage");
  var Connector = require("core/Connector");
  var Contents = require("core/Contents");
  var Locale = require("core/Locale");
  var Toolbar = require("core/Control/Toolbar");
  var Detail = require("core/Control/Detail");
  var Tabs = require("core/Control/Tabs");
  var Menu = require("core/Control/Menu");
  var Dialog = require("core/Dialog");
  var Action = require("core/Action");

  var TEMPLATE = '' +
'<div class="detailview-panel">' +
'  <div class="object-operations"></div>' +
'  <div class="object-detail"></div>' +
'</div>';

  function edit_toolbar(toolbar, on) {
    //var READING = ["edit", "delete"];
    //var WRITING = ["save", "cancel"];
    //toolbar.show.apply(toolbar, on ? WRITING : READING);
    //toolbar.hide.apply(toolbar, on ? READING : WRITING);
    //toolbar.refresh();
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
  
  function get_files(fields, data) {
    var files_fields = fields.filter(function(field, index) {
      var attachments = [
        "748189ad-ce16-43f6-ae2a-fa48e5ec4a39", // Files
        "4ee20d87-b73d-40a7-a521-170593ac2512"  // Images
      ];
      return attachments.some(function (id) {
        return field.datatype.id == id;
      });
    });
    var files = {};
    for (var i = 0; i < files_fields.length; i++) {
      var field = files_fields[i];
      var added = data[field.name].added;
      for (var key in added) {
        files[key] = added[key];
      }
    }
    return files;
  };

  function DetailView () {
    this._class_id = null;
    this._object_id = null;
    this._class = null;
    this._object = null;
    this._renderer = null;
    this._toolbar = null;
    this._detail = null;
  }
  
  DetailView.id = "a9bc6cc7-e6fc-4b19-8c7e-468bc2922f25";
  
  DetailView.edit = function (event) {
    var view = event.item.context;
    view.detail().edit(true);
    view.detail().refresh();
    edit_toolbar(view.toolbar(), true);
  };
  
  DetailView.delete = function (event) {
  	var item = event.item;
    var entry_props = !item.function_entry ? null : item.function_entry.properties;
    
    var message = !entry_props ? "Do you want to delete?" : Locale.translate(entry_props.confirm_message);
    Dialog.confirm(message, item.text)
    .yes(function() {
      var view = event.item.context;
      var objects = null;
      Storage.delete(view._class_id, view._object_id)
      .done(function() {
        app.contents().tabs().broadcast(view._class_id, view._object_id, null);
        app.contents().tabs().remove(view._class.class_type.properties.detail_view.id, view._class_id, view._object_id);
        var message = !entry_props ? "Deleted" : Locale.translate(entry_props.deleted_message);
        Dialog.show(message, item.text);
      })
      .fail(function(jqXHR, text_status, error_thrown) {
        var message = !entry_props ? "Failed to delete." : Locale.translate(entry_props.deleted_failed_message);
        if (jqXHR.status == 410) {
          Dialog.show(message, item.text);
          console.log("[Delete] This item (or Class) has already been deleted by other user.Closing this tab.");
          app.contents().tabs().remove(view._class.class_type.properties.detail_view.id, view._class_id, view._object_id);
        } else {
          Dialog.show(message, item.text);
        }
      });
    });
  };

  DetailView.save = function (event) {
  	var item = event.item;
    var entry_props = !item.function_entry ? null : item.function_entry.properties;
    
    var view = item.context;
    var detail = view.detail();
    var data = detail.data();
    var object = null;

    // Get field information
    var fields = detail._fields;
    var key_field_names = fields.filter(function(field, index) { return !(!field.key); })
                                .map(function(field){ return field.name; });
    key_field_names.push("id");
    console.assert(0 < key_field_names.length, key_field_names);
    var key_field_name = key_field_names[0];
    var files = get_files(fields, data);
    
    if (detail.is_new()) {
      Storage.create(view._class.id, data, files)
      .done(function(object) {
        edit_toolbar(view.toolbar(), false);
        var new_object_id = object[key_field_name];
        view._object_id = new_object_id;
        detail.data(object);
        detail.edit(false);
        detail.refresh();
        (new Class(view._class)).renderer()
        .done(function (renderer) {
          var label = renderer(object);
          app.contents().tabs().change(view._class.class_type.properties.detail_view.id, view._class.id, Uuid.NULL, new_object_id, label);
          app.contents().tabs().broadcast(view._class.id, new_object_id, object);
          var message = !entry_props ? "Created" : Locale.translate(entry_props.created_message);
          Dialog.show(message, item.text);
        });
      })
      .fail(function(jqXHR, text_status, error_thrown) {
        var message = !entry_props ? "Failed to create" : Locale.translate(entry_props.created_failed_message);
        if (jqXHR.status == 410) {
          Dialog.show(message, item.text);
          console.log("[Save] The Class of this item has already been deleted by other user. Closing this tab.");
          app.contents().tabs().remove(view._class.class_type.properties.detail_view.id, view._class.id, Uuid.NULL);
        } else {
          Dialog.show(message, item.text);
        }
      });
    } else {
      if (!data[key_field_name]) {
        data[key_field_name] = view._object_id;
      }
      Storage.update(view._class.id, data[key_field_name], data, files)
      .done(function(object) {
        edit_toolbar(view.toolbar(), false);
        detail.edit(false);
        detail.commit();
        detail.refresh();
        (new Class(view._class)).renderer()
        .done(function (renderer) {
          var label = renderer(data);
          app.contents().tabs().label(view._class.class_type.properties.detail_view.id, view._class.id, view._object_id, label);
          app.contents().tabs().broadcast(view._class.id, view._object_id, data);
          var message = !entry_props ? "Updated" : Locale.translate(entry_props.updated_message);
          Dialog.show(message, item.text);
        });
      })
      .fail(function(jqXHR, text_status, error_thrown) {
        var message = !entry_props ? "Failed to update" : Locale.translate(entry_props.updated_failed_message);
        if (jqXHR.status == 410) {
          Dialog.show(message, item.text);
          console.log("[Save] This item (or Class) has already been deleted by other user. Closing this tab.");
          app.contents().tabs().remove(view._class.class_type.properties.detail_view.id, view._class.id, view._object_id);
        } else {
          Dialog.show(message, item.text);
        }
      });
    }
  };
  
  DetailView.cancel = function (event) {
  	var item = event.item;
    var entry = item.function_entry;
    var message = "Do you want to cancel the current editing?";
    if (entry && entry.properties && entry.properties.confirm_message) {
      message = Locale.translate(entry.properties.confirm_message);
    }
    Dialog.confirm(message, item.text)
    .yes(function() {
      var view = event.item.context;
      
      if (view.is_new()) {
        app.contents().tabs().broadcast(view._class_id, view._object_id, null);
        app.contents().tabs().remove(view._class.class_type.properties.detail_view.id, view._class_id, view._object_id);
        return;
      }
      
      edit_toolbar(view.toolbar(), false);
      var detail = view.detail();
      detail.restore();
      detail.edit(false);
      detail.refresh();
    });
  };

  function convert_pdf_field(properties) {
    return {
      "type" : "text",
      "text" : "[" + properties.field.field_name + "]",
      "font" : properties.font,
      "font_size" : parseFloat(properties.font_size),
      "x" : parseFloat(properties.x),
      "y" : parseFloat(properties.y)
    };
  }
  
  function convert_pdf_line(properties) {
    return {
      "type" : "line",
      "x1" : parseInt(properties.x1),
      "y1" : parseInt(properties.y1),
      "x2" : parseInt(properties.x2),
      "y2" : parseInt(properties.y2)
    };
  }
  
  function convert_pdf_phrase(properties) {
    return {
      "type" : "phrase",
      "text" : properties.text
    };
  }
  
  DetailView.create_pdf = function (event) {
  	var item = event.item;
    var entry = item.function_entry;
    var print_objects = entry.properties.pdf_objects.map(function (pdf_object) {
      var type_id = pdf_object.type.id;
      var properties = pdf_object.type.properties;
      var print_object = null;
      if (type_id == "fe5cd94a-93c6-41eb-a16f-6628a915f05a") {
        print_object = Utils.clone(properties);
        print_object.type = "text";
        print_object.font_size = parseFloat(print_object.font_size);
        print_object.x = parseFloat(print_object.x);
        print_object.y = parseFloat(print_object.y);
      } else if (type_id == "778cb434-c527-4350-911d-59902ee7aa45") {
        print_object = convert_pdf_field(properties);
      } else if (type_id == "9ca65e40-bd09-46c2-955a-e19e07be9a17") {
        print_object = convert_pdf_line(properties);
      } else if (type_id == "bff15667-03ad-40be-aa21-c556ae35ce7b") {
        print_object = convert_pdf_phrase(properties);
      }
      return print_object;
    });
    var pdf_data = Utils.clone(entry.properties);
    pdf_data.pdf_objects = print_objects;
    Connector.pdf(pdf_data);
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

    Storage.read(self._class_id, self._object_id)
    .done(function (data) {
      self._object = data;
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

  DetailView.prototype.caption = function () {
    if (this.is_new()) {
      return "New " + Locale.translate(this._class.label);
    }
    var caption = this._renderer(this._object);
    return caption;
  };

  DetailView.prototype.is_new = function () {
    return this._detail.is_new();
  };

  DetailView.prototype.init = function (selector, class_id, object_id) {
    var dfd = new $.Deferred;

    this._class_id = class_id;
    this._object_id = object_id;
    this._toolbar = new Toolbar();
    this._detail = new Detail();
    var view = $(selector);
    var basic_assist = null;
    var custom_assist = null;
    var object = null;
    var self = this;
    
    var toolbar_selector = selector + "> div.detailview-panel > div.object-operations";
    var detail_selector = selector + "> div.detailview-panel > div.object-detail";
    
    function get_object_data(self, class_id_, object_id_) {
      if (object_id_ == Uuid.NULL) {
        console.log("Didn't call Storage.read method to get object data.");
        var dfd = new $.Deferred;
        dfd.resolve();
        return dfd.promise();
      }
      return Storage.read(class_id_, object_id_).done(function (data) { self._object = data; });
    }
    
    $.when(
      Utils.load_css("/core/Control/View/DetailView.css"),
      Storage.read(Class.CLASS_ID, class_id).done(function (data) { self._class = data; }),
      get_object_data(self, class_id, object_id)
    )
    .then(function() {
      return (new Class(self._class)).renderer().done(function (renderer) { self._renderer = renderer; });
    })
    .then(function() {
      view.append(TEMPLATE);
    })
    .then(function() {
      return self._toolbar.init(toolbar_selector);
    })
    .then(function() {
      var src_items = Utils.get_as_json(null, function() { return self._class.class_type.properties.detail_view.properties.toolbar_items; });
      if (!src_items)
        return;
      return Menu.convert(src_items, self).done(function(dst_items) { self._toolbar.items(dst_items); });
    })
    .then(function() {
      return self._detail.init(detail_selector, self._class.object_fields, basic_assist, custom_assist);
    }).then(function() {
      self._detail.visible(true);
      if (self._object_id == Uuid.NULL) {
        edit_toolbar(self._toolbar, true);
        self._detail.edit(true);
      } else {
        edit_toolbar(self._toolbar, false);
        self._detail.edit(false);
        self._detail.data(self._object);
      }
      self._toolbar.visible(true);
      self.refresh();
    })
    .then(function() {
      dfd.resolve(self);
    });
    return dfd.promise();
  };

  return DetailView;
});
