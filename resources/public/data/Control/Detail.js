define(function (require) { 
  require("jquery");
  var Utils = require("data/Core/Utils");
  var Inherits = require("data/Core/Inherits");

  var TEMPLATE = '<div class="w2ui-field"></div>';

  function get_control_assist(self, field) {
    if (!self._custom_assist) {
      return null;
    }
    if (!self._custom_assist[field.name]) {
      return null;
    }
    return self._custom_assist[field.name];
  }

  function get_control_path(self, field, assist) {
    var datatype = field.datatype;
    var primitive_id = datatype["primitive"];
    if (primitive_id != "") {
      return "data/Control/Field/" + primitive_id;
    }
    var class_id = datatype["class"];
    if (!class_id || class_id == "") {
      console.assert(false, "Field.name=[" + field.name + "] 'datatype' property ('primitive' or 'class') was not specified.");
      return null;
    }
    
    var is_multi = datatype["multi"];
    var is_embedded = datatype["embedded"];

    if (is_multi && is_embedded ) {
      return "data/Control/Field/Multi";
    } else if (is_multi && !is_embedded) {
      return "data/Control/Field/List";
    } else if (!is_multi && is_embedded) {
      return "data/Control/Field/Complex";
    } else if (!is_multi && !is_embedded) {
      return "data/Control/Field/DropDownList";
    } else {
      console.assert(false, "Unexpected case.");
    }
  }

  function field_func(self, field_selector, field) {
    var dfd = new $.Deferred;
    var assist = get_control_assist(self, field);
    var control_path = get_control_path(self, field, assist);
    if (!control_path) {
      dfd.resolve();
      return dfd.promise();
    }
    
    require([control_path], function(Control) {
      var control = new Control();
      self._controls[field.name] = control;
      try {
        control.init(field_selector, field, assist)
        .then(function() {
          dfd.resolve();
        });
      } catch (e) {
        console.assert(false, "e=" + e + ", field.name=" + field.name);
      }
    });
    return dfd.promise();
  }

  function create_form(self, selector) {
    var dfd = new $.Deferred;
    // Declare 'each_field_funcs' array to closing each require 'Controls' & callback process
    if (!self._class.object_fields) {
      dfd.resolve();
      return dfd.promise();
    }
    var promises = [];
    for (var i = 0; i < self._class.object_fields.length; i++) {
      var object_field = self._class.object_fields[i];
      self._root.append(TEMPLATE);
      var field = self._root.find("div:last-child");
      field.attr("name", object_field.name);
      var field_selector = selector + " > div[name='" + object_field.name + "']";
      promises[i] = field_func(self, field_selector, object_field);
    }
    $.when.apply(null, promises)
    .then(function() {
      dfd.resolve();
    });
    return dfd.promise();
  }

  function get_value(control) {
    var type = control.prop("type");
    alert(control.prop("name"));
    return type == "checkbox" ? control.prop("checked") : control.val();
  }

  function set_value(control, value) {
    var type = control.prop("type");
    if (type == "checkbox") {
      control.prop("checked", value);
    } else {
      control.val(value);
    }
  }
  
  function Detail(parent) {
  	this._parent = parent;
  	this._root = null;
    this._class = null;
    this._basic_assist = null;
    this._custom_assist = null;
    this._data = null;
    this._func_ok = null;
    this._root_template = null;
    this._assist_template = null;
    this._fields_template = null;
    this._controls = {};
    this._is_new = true;
    this._instance = this;
  }

  Detail.prototype.update = function(keys) {
    for (var name in this._controls) {
      var control = this._controls[name]
      control.update(keys);
    }
  };

  Detail.prototype.init = function(selector, class_, basic_assist, custom_assist) {
    var dfd = new $.Deferred;
    // Set member fields
    this._root = $(selector);
    this._root.hide();
    if (0 < this._root.children()) {
      dfd.resolve();
      return dfd.promise();
    }
    this._class = class_;
    this._basic_assist = typeof basic_assist == "undefined" ? null : basic_assist;
    this._custom_assist = typeof custom_assist == "undefined" ? null : custom_assist;
    var self = this;
    var selector_buf = selector;

    Utils.load_css("/data/Style/Detail.css");
    
    this._root.append(TEMPLATE);
    $.when(
      create_form(self, selector_buf)
    ).always(function() {
      dfd.resolve();
    });
    //var form = this._root.find("div");
    //form.w2form({ 
    //  name   : 'myForm',
    //  fields : [
    //    { name: 'first_name', type: 'text', required: true },
    //    { name: 'last_name',  type: 'text', required: true },
    //    { name: 'comments',   type: 'text'}
    //  ],
    //  //actions: {
    //  //  reset: function () { console.log("reset"); },
    //  //  save: function () { console.log("save"); }
    //  //}
    //});
    
    return dfd.promise();
  };

  Detail.prototype.visible = function(visible) {
    if (arguments.length == 0) {
      return this._root.css("display") == "none" ? false : true;
    }
    this._root.css("display", visible ? "block" : "none");
  };

  Detail.prototype.edit = function(on) {
    if (!this._class.object_fields) {
      return;
    }
    for (var i = 0; i < this._class.object_fields.length; i++) {
      var field = this._class.object_fields[i];
      var name = field.name;
      this._controls[name].edit((!this._is_new && !(!field.key)) ? false : on);
    }
  };

  Detail.prototype.commit = function() {
    for (var i = 0; i < this._class.object_fields.length; i++) {
      var object_field = this._class.object_fields[i];
      var name = object_field.name;
      this._controls[name].commit();
    }
  };

  Detail.prototype.restore = function() {
    for (var i = 0; i < this._class.object_fields.length; i++) {
      var object_field = this._class.object_fields[i];
      var name = object_field.name;
      this._controls[name].restore();
    }
  };

  Detail.prototype.is_new = function() {
    return this._is_new;
  };

  Detail.prototype.refresh = function() {
    if (!this._class.object_fields) {
      return;
    }
    
    for (var i = 0; i < this._class.object_fields.length; i++) {
      var object_field = this._class.object_fields[i];
      var name = object_field.name;
      var control = this._controls[name];
      if (control)
        control.refresh();
    }
  };

  Detail.prototype.data = function(value) {
    var data = {};

    var exist_object_fields = !this._class.object_fields ? false : true;
    if (exist_object_fields) {
      for (var i = 0; i < this._class.object_fields.length; i++) {
        var object_field = this._class.object_fields[i];
        var name = object_field.name;
        var control = this._controls[name];
        if (arguments.length == 0) {
          data[name] = control.data();
        } else {
          control.data(value ? value[name] : null);
        }
      }
    }
    
    if (arguments.length == 0) {
      return data;
    } else {
      this._is_new = !value ? true : false;
    }
  };
  
  return Detail;
});
