define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Connector = require("core/Connector");
  var Inherits = require("core/Inherits");
  var Field = require("core/Control/Field/Field");
  var Class = require("core/Class");
  
  var TEMPLATE = '' +
'<label></label>' +
'<div>' +
'  <div style="width:100px;">Class:</div><select name="class" style="color:black;"></select>' +
'  <div style="width:100px;">Field:</div><select name="field" style="color:black;"></select>' +
'</div>';

  var OPTION_TEMPLATE = '<option></option>';

  function create_dropdown(dropdown, class_, objects) {
    dropdown.empty();
    var captions = class_.captions(objects);
    for (var i = 0; i < objects.length; i++) {
      dropdown.append(OPTION_TEMPLATE);
      var option = self._dropdown.find("option:last-child");
      option.attr("value", i);
      option.text(captions[i]);
    }
  }
  
  function Fields() {
    Field.call(this, "core/Control/Field", "Fields");
    this._selector = null;
  	this._dropdown_class = null;
  	this._dropdown_field = null;
  	this._value = null;
    this._classes = null;
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
    var label = root.find("label");
    label.text(field.label);
    
    // Dropdown controls
    self._dropdown_class = root.find("select[name='class']");
    self._dropdown_field = root.find("select[name='field']");

    var self = this;
    $.when(
      Connector.crud.read("api/" + Utils.CLASS_ID, "json", function(response) { self._classes = response; }),
    ).then(function() {
      // Data
      var class_of_class = null;
      var class_of_field = null;
      for (var i = 0; i < self._classes.length; i++) {
        var tmp_class = self._classes[i];
        if (Class.CLASS_ID == tmp_class.id) {
          class_of_class = tmp_class;
        }
        if (Class.FIELD_ID == tmp_class.id) {
          class_of_field = tmp_class;
        }
      }

      // Assgin data & behavior
      create_dropdown(self._dropdown_class, class_of_class, self._classes);
      self._dropdown_class.on("change", function(event) {
        var index = parseInt(self._dropdown_class.val());
        if (index < 0) {
          return;
        }
        create_dropdown(self._dropdown_field, class_of_field, self._classes[index].object_fields);
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
      var field_name = index < 0 ? null : class_.object_field[index].name;
      
      return { "class_id" : class_id, "field_name" : field_name };
    } else {
      this._value = value;
      var index_ = null;
      
      // Class
      index_ = -1;
      var class_ = self._classes.find(function(item, i) {
        if (item.id != this._value.class_id) {
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
      
      // Field
      index_ = -1;
      var field = class_.object_field.find(function(item, i) {
        if (item.name != this._value.field_name) {
          return false;
        }
        index = i;
        return true;
      });
      if (index == -1) {
        this._dropdown_field.val(index);
        return;
      }
    }
  };
  
  Fields.prototype.update = function(keys) {
  };

  return Fields;
}); 
