define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Class = require("core/Class");
  var Connector = require("core/Connector");
  var Inherits = require("core/Inherits");
  var Field = require("core/Control/Field/Field");
  var Class = require("core/Class");
  
  var TEMPLATE = '' +
'<label></label>' +
'<div>' +
'  <div style="display:inline-block;color:#666;">Class:</div><select name="class" style="color:black;"></select>' +
'  <div style="display:inline-block;color:#666;">Field:</div><select name="field" style="color:black;"></select>' +
'</div>';

  var OPTION_TEMPLATE = '<option></option>';

  function create_dropdown(dropdown, class_, objects) {
    var captions = (new Class(class_)).captions(objects);
    captions.unshift("");
    dropdown.empty();
    captions.forEach(function(caption, index) {
      dropdown.append(OPTION_TEMPLATE);
      var option = dropdown.find("option:last-child");
      option.attr("value", index - 1);
      option.text(caption);
    });
  }
  
  function Fields() {
    Field.call(this, "core/Control/Field", "Fields");
    this._selector = null;
  	this._dropdown_class = null;
  	this._dropdown_field = null;
  	this._value = null;
    this._classes = null;
    this._class_of_class = null;
    this._class_of_field = null;
  }
  Inherits(Fields, Field);

  Fields.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    this._selector = selector;
    var root = $(selector);
    if (0 < root.children()) {
      dfd.resolve();
      return dfd.promise();
    }
    // root
    root.empty();
    root.append(TEMPLATE);
    
    // Label
    var label = root.children("label");
    label.text(field.label);
    
    // Dropdown controls
    this._dropdown_class = root.find("select[name='class']");
    this._dropdown_field = root.find("select[name='field']");

    var self = this;
    $.when(
      Connector.crud.read("api/" + Class.CLASS_ID, "json", function(response) { self._classes = response; })
    ).then(function() {
      // Data
      for (var i = 0; i < self._classes.length; i++) {
        var tmp_class = self._classes[i];
        if (Class.CLASS_ID == tmp_class.id) {
          self._class_of_class = tmp_class;
        }
        if (Class.FIELD_ID == tmp_class.id) {
          self._class_of_field = tmp_class;
        }
      }

      // Assgin data & behavior
      create_dropdown(self._dropdown_class, self._class_of_class, self._classes);
      self._dropdown_class.on("change", function(event) {
        var index = parseInt(self._dropdown_class.val());
        if (index < 0) {
          return;
        }
        create_dropdown(self._dropdown_field, self._class_of_field, self._classes[index].object_fields);
      });
      dfd.resolve();
    });
    return dfd.promise();
  };

  Fields.prototype.edit = function(on) {
    if (arguments.length == 0) {
      return this._dropdown_class.attr("disabled") ? false : true;
    } else {
      this._dropdown_class.attr("disabled", on ? false : true);
      this._dropdown_field.attr("disabled", on ? false : true);
    }
  };
  
  Fields.prototype.backuped = function() {
    return this._value;
  };

  Fields.prototype.commit = function() {
    this._value = this.data();
  };

  Fields.prototype.restore = function() {
    this._dropdown_class.val(this._value == null ? "" : this._value.class_id);
    this._dropdown_field.val(this._value == null ? "" : this._value.field_name);
  };

  Fields.prototype.data = function(value) {
    if (arguments.length == 0) {
      var index = null;
      // Class
      index = this._dropdown_class.val();
      var class_ = this._classes[index];
      var class_id = index < 0 ? null : class_.id;
      // Field
      index = this._dropdown_field.val();
      var field_name = index < 0 ? null : class_.object_fields[index].name;
      
      return { "class_id" : class_id, "field_name" : field_name };
    } else {
      this._value = value;
      var index_ = null;
      
      var self = this;
      
      // Class
      index_ = -1;
      var class_ = this._classes.find(function(item, i) {
        if (item.id != self._value.class_id) {
          return false;
        }
        index = i;
        return true;
      });
      if (index == -1) {
        this._dropdown_class.val(index);
        this._dropdown_field.val(index);
        return;
      }
      this._dropdown_class.val(index);
      
      // Field
      create_dropdown(this._dropdown_field, self._class_of_field, class_.object_fields);
      index_ = -1;
      var field = class_.object_fields.find(function(item, i) {
        if (item.name != self._value.field_name) {
          return false;
        }
        index = i;
        return true;
      });
      if (index == -1) {
        this._dropdown_field.val(index);
        return;
      }
      this._dropdown_field.val(index);
    }
  };
  
  Fields.prototype.update = function(keys) {
  };

  return Fields;
}); 
