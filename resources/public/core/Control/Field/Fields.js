define(function (require) { 
  require("jquery");
  var app = require("app");
  var Utils = require("core/Utils");
  var Locale = require("core/Locale");
  var Class = require("core/Class");
  var Storage = require("core/Storage");
  var Inherits = require("core/Inherits");
  var Field = require("core/Control/Field/Field");
  var Grid = require("core/Control/Grid");
  var Finder = require("core/Control/Finder");
  
  var TEMPLATE = '' +
'<label></label>' +
'<div>' +
'  <div name="class"></div>' +
'  <div name="field"></div>' +
'</div>';

  function Fields() {
    Field.call(this, "core/Control/Field", "Fields");
    this._selector = null;
    this._value = null;
    this._self_reference = null;
    this._classes = null;
    this._class = { _class:null, columns:null, finder:null, converter:null };
    this._field = { _class:null, columns:null, finder:null, converter:null };
  }
  Inherits(Fields, Field);

  Fields.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    // Selector & Root
    this._selector = selector;
    var root = $(selector);
    if (0 < root.children()) {
      dfd.resolve();
      return dfd.promise();
    }
    root.empty();
    root.append(TEMPLATE);
    
    // Label
    var label = root.children("label");
    var caption = Locale.translate(field.label);
    label.text(caption);
    
    // Finders
    this._class.finder = new Finder();
    this._field.finder = new Finder();
    
    var properties = field.datatype.properties;
    var min_width = !properties ? null : properties.min_width;
    this._self_reference = !properties ? false : (!properties.self_reference ? false : properties.self_reference);

    var self = this;
    
    Storage.read(Class.CLASS_ID)
    .then(function(classes) {
      self._classes = classes;
      self._class._class = self._classes[Class.CLASS_ID];
      self._field._class = self._classes[Class.FIELD_ID];
    })
    .then(function () {
      return Grid.create_columns(self._class._class)
      .then(function (columns) {
        self._class.columns = columns;
      });
    })
    .then(function () {
      return Grid.create_columns(self._field._class).then(function (columns) { self._field.columns = columns; });
    })
    .then(function () {
      function converter(objects) {
        return (new Class(self._class._class)).captions(objects);
      }
      return self._class.finder.init(selector + " > div > div[name='class']", self._class.columns, self._classes, "Class", false, min_width, converter);
    })
    .then(function () {
      function converter(objects) {
        return (new Class(self._field._class)).captions(objects);
      }
      return self._field.finder.init(selector + " > div > div[name='field']", self._field.columns, {}, "Field", false, min_width, converter);
    })
    .then(function () {
      self._class.finder.ok(function (recids) {
        var recid = recids[0];
        var fields = {};
        self._classes[recid].object_fields.forEach(function (field) {
          if (field.recid)
            delete field.recid;
          field.id = field.name;
          fields[field.id] = field;
        });
        self._field.finder._objects = fields;
        self._field.finder.clear();
      });
    })
    .then(function () {
      dfd.resolve();
    });
    return dfd.promise();
  };

  Fields.prototype.edit = function(on) {
    if (arguments.length == 0) {
      return this._field.finder._editting;
    }

    if (!this._self_reference)
      this._class.finder.edit(on);
    this._field.finder.edit(on);
  };
  
  Fields.prototype.backuped = function() {
    var class_id = this._class.finder.backuped();
    var field_name = this._field.finder.backuped();
    return { "class_id" : class_id, "field_name" : field_name };
  };

  Fields.prototype.commit = function() {
    this._class.finder.commit();
    this._field.finder.commit();
  };

  Fields.prototype.restore = function() {
    this._class.finder.restore();
    this._field.finder.restore();
  };

  Fields.prototype.data = function(value) {
    if (arguments.length == 0) {
      var class_id = this._class.finder.data();
      var field_name = this._field.finder.data();
      return { "class_id" : class_id, "field_name" : field_name };
    }

    var self_class_id = null;
    if (this._self_reference) {
      var tab = app.contents().tabs().current();
      self_class_id = tab.class_id == Class.CLASS_ID ? tab.object_id : tab.class_id;
    }
    
    if (!value && !this._self_reference) {
      this._field.finder._objects = {};
      this.refresh();
      return;
    }

    var class_id = !self_class_id ? value.class_id : self_class_id;
    var field_name = !value ? null : value.field_name;
    this._class.finder.data(class_id);
    this._field.finder.data(field_name);
    var objects = {};
    this._classes[class_id].object_fields.forEach(function (field) {
      if (field.recid)
        delete field.recid;
      field.id = field.name;
      objects[field.id] = field;
    });
    this._field.finder._objects = objects;
    this.refresh();
  };
  
  Fields.prototype.update = function(keys) {
  };

  Fields.prototype.refresh = function() {
    this._class.finder.refresh();
    this._field.finder.refresh();
  };

  Fields.renderer = function(field) {
    var dfd = new $.Deferred;
    var classes = null;
    $.when(
      Storage.read(Class.CLASS_ID).done(function(data) { classes = data; })
    ).always(function() {
      var renderer = function(record, index, column_index) {
        var value = record[field.name];
        var class_ = classes[value.class_id];
        if (!class_) {
          return "/";
        }
        var fields = class_.object_fields.filter(function (field_) { return field_.name == value.field_name });
        var field_ = fields[0];
        return Locale.translate(class_.label) + "/" + (!field_ ? "" : Locale.translate(field_.label));
      };
      dfd.resolve(renderer);
    });
    return dfd.promise();
  };

  return Fields;
});
