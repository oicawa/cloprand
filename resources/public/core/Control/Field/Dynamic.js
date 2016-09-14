define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Connector = require("core/Connector");
  var Inherits = require("core/Inherits");
  var Field = require("core/Control/Field/Field");
  var Detail = require("core/Control/Detail");
  
  var TEMPLATE = '' +
'<label></label>' +
'<div>' +
'  <select style="color:black;"></select>' +
'  <div class="detail"></div>' +
'</div>';

  var OPTION_TEMPLATE = '<option></option>';

  function create_dropdown(self, root, field) {
    root.empty();
    root.append(TEMPLATE);
    
    var label = root.find("label");
    label.text(field.label);
    
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
    
    self._dropdown.on("change", function(event) {
      create_detail(self, root);
    });
    
    self._dropdown.val(self._value == null ? "" : self._value.id);
  }
  
  function create_detail(self, root) {
    var object = self._objects.find(function (element, index, array) {
      var value = self._dropdown.val();
      return element.id == value;
    });
    
    var detail = root.find("div > div.detail");
    detail.empty();
    
    if (!object) {
      return;
    }
    
    self._detail = new Detail();
    $.when(
      self._detail.init(self._selector + " > div > div.detail", object[self._field_name])
    ).always(function() {
      self._detail.edit(self.edit());
      self._detail.data(self._value == null ? null : self._value.properties);
      self._detail.visible(true);
    });
  }
  
  function Dynamic() {
    Field.call(this, "core/Control/Field", "Dynamic");
    this._selector = null;
    this._field_name = null;
  	this._dropdown = null;
  	this._detail = null;
  	this._value = null;
    this._class = null;
    this._objects = null;
    this._items = {};
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
    var class_id = properties.class_id;
    this._field_name = properties.field_name;
    var self = this;
    console.assert(!(!class_id), field);
    $.when(
      Connector.crud.read("api/" + Utils.CLASS_ID + "/" + class_id, "json", function(response) { self._class = response; }),
      Connector.crud.read("api/" + class_id, "json", function(response) { self._objects = response; })
    ).then(function() {
      create_dropdown(self, root, field);
      create_detail(self, root);
      dfd.resolve();
    });
    return dfd.promise();
  };

  Dynamic.prototype.edit = function(on) {
    if (arguments.length == 0) {
      return this._dropdown.attr("disabled") ? false : true;
    } else {
      this._dropdown.attr("disabled", on ? false : true);
      if (this._detail != null)
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
    this._dropdown.val(this._value == null ? "" : this._value.id);
    // set value.properties into this._detail in event handler.
  };

  Dynamic.prototype.data = function(value) {
    if (arguments.length == 0) {
      var id = this._dropdown.val();
      var properties = {};
      if (this._detail) {
        properties = this._detail.data();
      }
      return { "id":id, "properties":properties };
    } else {
      this._value = value;
      this._dropdown.val(value == null ? "" : value.id);
      var root = $(this._selector);
      create_detail(this, root);
      // set value.properties into this._detail in event handler.
    }
  };
  
  Dynamic.prototype.update = function(keys) {
  }

  return Dynamic;
}); 
