define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Class = require("core/Class");
  var Connector = require("core/Connector");
  var Inherits = require("core/Inherits");
  var Field = require("core/Control/Field/Field");
  var Detail = require("core/Control/Detail");
  var Dialog = require("core/Dialog");
  
  var TEMPLATE = '' +
'<label></label>' +
'<div>' +
'  <select style="color:black;"></select><button style="width:30px;">...</button>' +
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
      if (!self._embedded) {
        return;
      }
      create_detail(self, root);
    });
    
    self._dropdown.val(self._value == null ? "" : self._value.id);
  }
  
  function create_button(self, root) {
    self._button = root.find("button");
    self._button.on('click', function (evnet) {
      var object = null;
      var detail = new Detail();
      var dialog = new Dialog();
      dialog.init(function(id) {
        var dfd = new $.Deferred;
        
        var objects = self._objects.filter(function (element, index, array) {
          var value = self._dropdown.val();
          return element.id == value;
        });
        object = objects[0];
        
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
        dialog.title(object.label + " Properties");
        dialog.buttons([
          {
            text : "OK",
            click: function (event) {
              console.log("[OK] clicked");
              self._dialog_data = detail.data();
              dialog.close();
              return false;
            }
          },
          {
            text : "Cancel",
            click: function (event) {
              console.log("[Cancel] clicked");
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
    var objects = self._objects.filter(function (element, index, array) {
      var value = self._dropdown.val();
      return element.id == value;
    });
    var object = objects[0];

    var detail = root.find("div > div.detail");
    detail.empty();
    
    if (!object) {
      dfd.resolve();
      return dfd.promise();
    }
    
    self._detail = new Detail();
    $.when(
      self._detail.init(self._selector + " > div > div.detail", object[self._field_name])
    ).always(function() {
      self._detail.edit(self.edit());
      self._detail.data(self._value == null ? null : self._value.properties);
      self._detail.visible(true);
      dfd.resolve();
    });
    return dfd.promise();
  }
  
  function Dynamic() {
    Field.call(this, "core/Control/Field", "Dynamic");
    this._selector = null;
    this._field_name = null;
    this._embedded = null;
  	this._dropdown = null;
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
    var class_id = properties.field.class_id;
    this._field_name = properties.field.field_name;
    this._embedded = properties.embedded;
    var self = this;
    console.assert(!(!class_id), field);
    $.when(
      Connector.crud.read("api/" + Class.CLASS_ID + "/" + class_id, "json", function(response) { self._class = response; }),
      Connector.crud.read("api/" + class_id, "json", function(response) { self._objects = response; })
    ).then(function() {
      create_dropdown(self, root, field);
      create_button(self, root, self._class[this._field_name]);
      if (self._embedded) {
        create_detail(self, root);
        self._button.hide();
      }
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
      } else {
        properties = this._dialog_data;
      }
      return { "id":id, "properties":properties };
    } else {
      this._value = value;
      this._dialog_data = !value ? null : (!value.properties ? null : value.properties);
      this._dropdown.val(!value ? "" : value.id);
      var root = $(this._selector);
      if (this._embedded)
        create_detail(this, root);
      // set value.properties into this._detail in event handler.
    }
  };
  
  Dynamic.prototype.update = function(keys) {
  }

  return Dynamic;
}); 
