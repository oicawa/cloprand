define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Locale = require("core/Locale");
  var Class = require("core/Class");
  var Storage = require("core/Storage");
  var Inherits = require("core/Inherits");
  var Field = require("core/Control/Field/Field");
  
  var TEMPLATE = '' +
'<label></label>' +
'<div><select style="color:black;"></select></div>';

  var OPTION_TEMPLATE = '<option></option>';

  function create_control(self, root, field) {
    root.empty();
    root.append(TEMPLATE);
    
    var label = root.find("label");
    var caption = Locale.translate(field.label);
    label.text(caption);
    
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
        captions.push(value);
      }
      var value = !item.id ? item[caption_fields[0]] : item.id;
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
    this._class_id = field.datatype.properties.class_id;
    var self = this;
    console.assert(!(!this._class_id), field);
    $.when(
      Storage.read(Class.CLASS_ID, this._class_id)
             .done(function(data) {
               self._class = data;
             }),
      Storage.read(this._class_id)
             .done(function(data) {
               self._objects = Object.keys(data)
                                     .map(function(id) { return data[id]; });
             })
    ).then(function() {
      create_control(self, root, field);
      dfd.resolve();
    });
    return dfd.promise();
  };

  DropDownList.prototype.edit = function(on) {
    this._dropdown.attr("disabled", on ? false : true);
  };

  DropDownList.prototype.backuped = function() {
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

  
  }

  return DropDownList;
}); 
