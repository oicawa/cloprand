define(function (require) { 
  require("jquery");
  require("jsrender");
  require("JSON");
  var Utils = require("core/Utils");
  var Toolbar = require("controls/Toolbar/Toolbar");

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
    //if (assist && assist["control"]) {
    //  var control_name = self._custom_assist[field.name]["control"];
    //  return "controls/" + control_name + "/" + control_name;
    //}
    var datatype = field.datatype;
    // Primitive
    var primitive = datatype["primitive"];
    if (primitive && primitive != "") {
      return "controls/fields/" + primitive + "/" + primitive;
    }
    var class_id = datatype["class"];
    console.assert(Utils.UUID.test(class_id), "class_id:" + class_id);
    
    var is_multi = datatype["multi"];
    var is_embedded = datatype["embedded"];

    if (is_multi && is_embedded ) {
      //return "controls/Grid/Grid";
      return "controls/fields/Multi/Multi";
    } else if (is_multi && !is_embedded) {
      return "controls/fields/List/List";
    } else if (!is_multi && is_embedded) {
      return "controls/fields/Complex/Complex";
    } else if (!is_multi && !is_embedded) {
      return "controls/fields/DropDownList/DropDownList";
    } else {
      console.assert(false, "Unexpected case.");
    }
  }

  function field_func(self, selector, field) {
    var dfd = new $.Deferred;
    var assist = get_control_assist(self, field);
    var control_path = get_control_path(self, field, assist);
    var field_selector = selector + " > table.detail-fields > tbody > tr > td.value > div." + field.name;
    
    require([control_path], function(Control) {
      var control = new Control();
      self._controls[field.name] = control;
      try {
        control.init(field_selector, field, assist)
        .then(function() {
          console.log("[init] Completed " + control_path);
          dfd.resolve();
        });
      } catch (e) {
        console.log("e=" + e + ", field.name=" + field.name);
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
      promises[i] = field_func(self, selector, object_field);
    }
    $.when.apply(null, promises)
    .then(function() {
      dfd.resolve();
    });
    return dfd.promise();
  }

  function create_toolbar(self, selector) {
    var dfd = new $.Deferred;
    self._toolbar = new Toolbar();
    self._toolbar.init(selector + " > div.detail-operations", self._basic_assist ? self._basic_assist.toolbar : null)
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
    this._toolbar = null;
    this._controls = {};
    this._is_new = true;
    this._instance = this;
  }

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

    // Load template data & Create form tags
    Utils.add_css("/controls/Detail/Detail.css");
    Utils.get_template("controls", "Detail", function(response) { self._root_template = $.templates(response); })
    .then(function() {
      var root_html = self._root_template.render(self._class);
      self._root.append(root_html);
      $.when(
        create_form(self, selector_buf),
        create_toolbar(self, selector_buf)
      ).always(function() {
        dfd.resolve();
      });
    });
    return dfd.promise();
  };

  Detail.prototype.ok_func = function(func_ok) {
    this._func_ok = func_ok;
  };

  Detail.prototype.visible = function(visible) {
    if (arguments.length == 0) {
      return this._root.css("display") == "none" ? false : true;
    }
    this._root.css("display", visible ? "block" : "none");
  };

  Detail.prototype.edit = function(on) {
    if (on) {
      this._toolbar.button("edit").hide();
      this._toolbar.button("delete").hide();
      this._toolbar.button("save").show();
      this._toolbar.button("cancel").show();
    } else {
      this._toolbar.button("edit").show();
      this._toolbar.button("delete").show();
      this._toolbar.button("save").hide();
      this._toolbar.button("cancel").hide();
    }
    
    if (!this._class.object_fields) {
      return;
    }
    for (var i = 0; i < this._class.object_fields.length; i++) {
      var object_field = this._class.object_fields[i];
      var name = object_field.name;
      this._controls[name].edit(on);
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

  //Detail.prototype.key = function() {
  //  var key_name = this._assist.key;
  //  var control = this._controls[key_name];
  //  return control.backuped();
  //};
    
  Detail.prototype.data = function(value) {
    var data = {};

    var exist_object_fields = !this._class.object_fields ? false : true;
    console.log("[data] exist_object_fields = " + exist_object_fields);
    if (exist_object_fields) {
      for (var i = 0; i < this._class.object_fields.length; i++) {
        var object_field = this._class.object_fields[i];
        var name = object_field.name;
        var control = this._controls[name];
        if (arguments.length == 0) {
          data[name] = control.data();
        } else {
          console.log(value);
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