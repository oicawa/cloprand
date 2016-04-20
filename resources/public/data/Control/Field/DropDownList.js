define(function (require) { 
  require("jquery");
  var Utils = require("data/Core/Utils");
  var Connector = require("data/Core/Connector");
  var Inherits = require("data/Core/Inherits");
  var Field = require("data/Control/Field/Field");
  
  var TEMPLATE = '' +
'<select name="{{:name}}">' +
'</select>' +
'<div></div>';

  var OPTION_TEMPLATE = '' +
'  <option value="{{:value}}">{{:caption}}</option>';

  function create_control(self, root, field) {
    root.empty();
    root.append(TEMPLATE);
    
    self._editor = root.find("select");
    self._viewer = root.find("div");
    
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
    
    self._editor.attr("name", field.name);
    for (var i = 0; i < items.length; i++) {
      self._editor.append(OPTION_TEMPLATE);
      var option = self._editor.find("option:last-child");
      option.attr("value", items[i].value);
      option.text(items[i].caption);
    }
  }
  
  function DropDownList() {
    Field.call(this, "data/Control/Field", "DropDownList");
    this._class_id = null;
  	this._editor = null;
  	this._viewer = null;
    this._template = null;
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
    this._class_id = field.datatype["class"];
    var self = this;
    console.assert(!(!this._class_id), field);
    $.when(
      Connector.crud.read("api/" + Utils.CLASS_ID + "/" + this._class_id, "json", function(response) { self._class = response; }),
      Connector.crud.read("api/" + this._class_id, "json", function(response) { self._objects = response; })
    ).then(function() {
      create_control(self, root, field);
      dfd.resolve();
    });
    return dfd.promise();
  };

  DropDownList.prototype.edit = function(on) {
    if (on) {
      this._editor.show();
      this._viewer.hide();
    } else {
      this._editor.hide();
      this._viewer.show();
    }
  };

  DropDownList.prototype.backuped = function() {
    return this._viewer.attr("value");
  };

  DropDownList.prototype.commit = function() {
    var value = this._editor.val();
    this._viewer.text(this._items[value]);
    this._viewer.attr("value", value);
  };

  DropDownList.prototype.restore = function() {
    var value = this._viewer.attr("value");
    this._editor.val(value);
  };

  DropDownList.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._editor.val();
    } else {
      this._editor.val(value);
      this._viewer.text(this._items[value]);
      this._viewer.attr("value", value);
    }
  };
  
  DropDownList.prototype.update = function(keys) {

  
  }

  return DropDownList;
}); 
