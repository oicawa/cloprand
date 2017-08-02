define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Locale = require("core/Locale");
  var Class = require("core/Class");
  var Storage = require("core/Storage");
  var Inherits = require("core/Inherits");
  var Field = require("core/Control/Field/Field");
  var Detail = require("core/Control/Detail");
  var DivButton = require("core/Control/DivButton");
  var Finder = require("core/Control/Finder");
  var Grid = require("core/Control/Grid");
  var Dialog = require("core/Dialog");
  
  var TEMPLATE = '' +
'<div>' +
'  <div name="finder" style="display:inline-block;"></div><span></span>' +
'  <div class="detail"></div>' +
'</div>';

  var OPTION_TEMPLATE = '<option></option>';

  function create_finder(self, selector, columns, items, description, min_width) {
    self._finder = new Finder();
    function converter(objects) {
      return (new Class(self._class)).captions(objects);
    }
    return self._finder.init(selector, columns, items, description, false, min_width, converter);
  }

  function create_button(self, selector) {
    self._button = new DivButton();
    return self._button.init(selector, "<i class='fa fa-th-list'/>", function (evnet) {
      var object = null;
      var detail = new Detail();
      var dialog = new Dialog();
      dialog.init(function(id) {
        var dfd = new $.Deferred;
        
        object = self._objects[self._finder.data()];
        
        detail.init('#' + id, object[self._field_name])
        .then(function () {
          detail.data(self._dialog_data);
          detail.edit(true);
          detail.refresh();
          detail.visible(true);
          dfd.resolve();
        });
        return dfd.promise();
      }).then(function () {
        dialog.title(Locale.translate(object.label));
        dialog.buttons([
          {
            text : "OK",
            click: function (event) {
              self._dialog_data = detail.data();
              dialog.close();
              return false;
            }
          },
          {
            text : "Cancel",
            click: function (event) {
              dialog.close();
              return false;
            }
          }
        ]);
        dialog.open();
      });
    });
  }
  
  function create_detail(self, root) {
    var dfd = new $.Deferred;
    
    var detail = root.find("div > div.detail");
    detail.empty();
    
    var object = self._objects[self._finder.data()];
    if (!object) {
      dfd.resolve();
      return dfd.promise();
    }
    
    self._detail = new Detail();
    self._detail.init(self._selector + " > div > div.detail", object[self._field_name])
    .then(function() {
      self._detail.edit(self.edit());
      self._detail.data(self._value == null ? null : self._value.properties);
      self._detail.visible(true);
      self._detail.refresh();
      dfd.resolve();
    });
    return dfd.promise();
  }
  
  function Dynamic() {
    Field.call(this, "core/Control/Field", "Dynamic");
    this._selector = null;
    this._field_name = null;
    this._embedded = null;
    this._finder = null;
    this._button = null;
    this._detail = null;
    this._value = null;
    this._class = null;
    this._objects = null;
    this._items = {};
    this._dialog_data = null;
  }
  Inherits(Dynamic, Field);

  Dynamic.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    // Set member fields
    this._selector = selector;
    var root = $(selector);
    if (0 < root.children()) {
      dfd.resolve();
      return dfd.promise();
    }

    // Create form tags
    var properties = field.datatype.properties;
    if (!properties.field)
      console.log(properties);
    var class_id = !properties.field ? properties.class_id : properties.field.class_id;
    this._field_name = !properties.field ? properties.field_name : properties.field.field_name;
    this._embedded = properties.embedded;
    this._min_width = properties.min_width;
    var self = this;
    console.assert(!(!class_id), field);
    var field_map = null;
    var columns = null;
    $.when(
      Storage.read(Class.CLASS_ID, class_id).done(function(data) { self._class = data; }),
      Storage.read(class_id).done(function(data) { self._objects = data; })
    )
    .then(function () {
      return Class.field_map(self._class).then(function (field_map_) { field_map = field_map_; });
    })
    .then(function () {
      columns = Grid.columns(self._class, field_map);
    })
    .then(function() {
      root.empty();
      root.append(TEMPLATE);
      return create_finder(self, selector + " > div > div[name='finder']", columns, self._objects, self._field_name, self._min_width);
    })
    .then(function() {
      self._finder.ok(function() {
        if (!self._embedded) {
          return;
        }
        create_detail(self, root);
      });
    })
    .then(function() {
      return create_button(self, selector + " > div > span");
    })
    .then(function() {
      if (!self._embedded) {
        return;
      }
      self._button.visible(false);
      return create_detail(self, root);
    })
    .then(function() {
      dfd.resolve();
    });
    return dfd.promise();
  };

  Dynamic.prototype.edit = function(on) {
    if (arguments.length == 0) {
      return this._finder.edit();
    }
    this._finder.edit(on);
    if (this._detail) {
      this._detail.edit(on);
    }
  };
  
  Dynamic.prototype.backuped = function() {
    return this._value;
  };

  Dynamic.prototype.commit = function() {
    if (this._detail) {
      this._detail.commit();
    }
    this._value = this.data();
  };

  Dynamic.prototype.restore = function() {
    this._finder.data(!this._value ? "" : this._value.id);
    // set value.properties into this._detail in event handler.
  };

  Dynamic.prototype.data = function(value) {
    if (arguments.length == 0) {
      var id = this._finder.data();
      var properties = {};
      if (this._detail) {
        properties = this._detail.data();
      } else {
        properties = this._dialog_data;
      }
      return { "id":id, "properties":properties };
    } else {
      this._value = value;
      this._dialog_data = !value ? null : (!value.properties ? null : value.properties);
      this._finder.data(!value ? "" : value.id);
      var root = $(this._selector);
      if (this._embedded)
        create_detail(this, root);
      // set value.properties into this._detail in event handler.
    }
  };
  
  Dynamic.prototype.refresh = function(keys) {
    this._finder.refresh();
    if (this._detail) {
      this._detail.refresh();
    }
  }

  Dynamic.renderer = function(field) {
    var dfd = new $.Deferred;
    var class_id = field.datatype.properties.field.class_id;
    var class_ = null;
    var objects = null;
    $.when(
      Storage.read(Class.CLASS_ID, class_id).done(function(data) { class_ = data; }),
      Storage.read(class_id).done(function(data) { objects = data; })
    )
    .then(function () {
      var renderer = function(record, index, column_index) {
        var value = record[field.name];
        var object = objects[value.id];
        var caption = (new Class(class_)).captions([object])[0];
        return caption;
      };
      dfd.resolve(renderer);
    })
    return dfd.promise();
  };

  return Dynamic;
}); 
