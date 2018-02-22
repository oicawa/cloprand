define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Locale = require("core/Locale");
  var Class = require("core/Class");
  var Storage = require("core/Storage");
  var Inherits = require("core/Inherits");
  var Field = require("core/Control/Field/Field");
  
  var TEMPLATE = '<div><select style="color:black;"></select></div>';

  var OPTION_TEMPLATE = '<option></option>';

  function create_control(self, root, field) {
    root.empty();
    root.append(TEMPLATE);
    
    self._dropdown = root.find("select");
    
    var caption_fields = [];
    if (!self._class.object_fields) {
      self._class.object_fields = [];
    }
    for (var i = 0; i < self._class.object_fields.length; i++) {
      var object_field = self._class.object_fields[i];
      if (!object_field.caption) {
        continue;
      }
      caption_fields.push(object_field.name);
    }

    var items = [];
    items.push({id: "", label: ""});
    for (var i = 0; i < self._objects.length; i++) {
      var item = self._objects[i];
      var captions = [];
      for (var j = 0; j < caption_fields.length; j++) {
        var value = item[caption_fields[j]];
        captions.push(Locale.translate(value));
      }
      var value = item[self._field_name];
      var caption = captions.join(" ");
      items.push({value : value, caption : caption });
      self._items[value] = caption;
    }
    
    self._dropdown.attr("name", field.name);
    for (var i = 0; i < items.length; i++) {
      self._dropdown.append(OPTION_TEMPLATE);
      var option = self._dropdown.find("option:last-child");
      option.attr("value", items[i].value);
      option.text(items[i].caption);
    }
  }
  
  function DropDownList() {
    Field.call(this, "core/Control/Field", "DropDownList");
    this._class_id = null;
    this._field_name = null;
  	this._dropdown = null;
  	this._value = null;
    this._class = null;
    this._objects = null;
    this._items = {};
  }
  Inherits(DropDownList, Field);

  DropDownList.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    // Set member fields
    var root = $(selector);
    if (0 < root.children()) {
      dfd.resolve();
      return dfd.promise();
    }

    // Create form tags
    var data_source = field.datatype.properties.data_source;
    this._class_id = data_source.class_id;
    var tmp = data_source.field_name;
    this._field_name = is_null_or_undefined(tmp) || tmp === "" ? "id" : tmp;
    var self = this;
    $.when(
      Storage.read(Class.CLASS_ID, this._class_id).done(function(data) { self._class = data; }),
      Storage.read(this._class_id).done(function(data) { self._objects = Object.keys(data).map(function(id) { return data[id]; }); })
    ).then(function() {
      create_control(self, root, field);
      dfd.resolve();
    });
    return dfd.promise();
  };

  DropDownList.prototype.edit = function(on) {
    this._dropdown.attr("disabled", on ? false : true);
  };

  DropDownList.prototype.backup = function() {
    return this._value;
  };

  DropDownList.prototype.commit = function() {
    var value = this._dropdown.val();
    this._value = value;
  };

  DropDownList.prototype.restore = function() {
    this._dropdown.val(this._value);
  };

  DropDownList.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._dropdown.val();
    } else {
      this._dropdown.val(value);
      this._value = value;
    }
  };
  
  DropDownList.prototype.update = function(keys) {

  
  };
  
  DropDownList.renderer = function(field) {
    var dfd = new $.Deferred;
    var class_id = field.datatype.properties.data_source.class_id;
    var field_name = field.datatype.properties.data_source.field_name;
    var class_ = null;
    var objects = null;
    $.when(
      Storage.read(Class.CLASS_ID, class_id).done(function(data) { class_ = data; }),
      Storage.read(class_id).done(function(data) { objects = data; })
    ).always(function() {
      var renderer = function(record, index, column_index) {
        var value = record[field.name];
        if (is_null_or_undefined(value)) {
          return "";
        }
        
        var targets = Object.values(objects).filter(function(object) { return object[field_name] === value; });
        if (targets.length === 0) {
          return "";
        }
        var captions = (new Class(class_)).captions(targets);
        return captions[0];
      };
      dfd.resolve(renderer);
    });
    return dfd.promise();
  };

  return DropDownList;
}); 
