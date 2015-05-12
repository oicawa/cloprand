define(function (require) { 
  require("jquery");
  require("jsrender");
  var Utils = require("core/Utils");
  var Toolbar = require("controls/Toolbar/Toolbar");
  return function (parent) {
  	var _parent = parent;
  	var _root = null;
    var _type = null;
    var _assist = null;
    var _data = null;
    var _func_ok = null;
    var _root_template = null;
    var _assist_template = null;
    var _fields_template = null;
    var _toolbar = null;
    var _controls = {};
    var _is_new = true;
    var _instance = this;

    function get_control_assist(field) {
      if (!_assist) {
        return null;
      }
      if (!_assist[field.name]) {
        return null;
      }
      return _assist[field.name];
    }
    
    function get_control_path(field, assist) {
      if (assist && assist["control"]) {
        var control_name = _assist[field.name]["control"];
        return "controls/" + control_name + "/" + control_name;
      }
      var is_list = field.list;
      if (is_list) {
        return "controls/fields/List/List";
      }
      var match = Utils.UUID.test(field.datatype);
      if (match) {
        return "controls/fields/DropDownList/DropDownList";
      }
      return "controls/fields/" + field.datatype + "/" + field.datatype;
    }

    function field_func(selector, field) {
      var dfd = new $.Deferred;
      var assist = get_control_assist(field);
      var control_path = get_control_path(field, assist);
      require([control_path], function(Control) {
        var control = new Control();
        _controls[field.name] = control;
        try {
        control.init(selector + " > table.detail-fields > tbody > tr > td.value > div." + field.name, field, assist)
        .then(function() {
          dfd.resolve();
        });
        } catch (e) {
        console.log("e=" + e + ", field.name=" + field.name);
        }
      });
      return dfd.promise();
    }

    function create_form(selector) {
      var dfd = new $.Deferred;
      // Declare 'each_field_funcs' array to closing each require 'Controls' & callback process
      var field_funcs = [];
      for (var i = 0; i < _type.object_fields.length; i++) {
        var object_field = _type.object_fields[i];
        field_funcs[i] = field_func(selector, object_field);
      }
      $.when.apply(null,field_funcs)
      .then(function() {
        dfd.resolve();
      });
      return dfd.promise();
    }

    function create_toolbar(selector) {
      var dfd = new $.Deferred;
      _toolbar = new Toolbar(_instance);
      _toolbar.init(selector + " > div.detail-operations", _assist.toolbar)
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

    this.init = function(selector, type, assist) {
      var dfd = new $.Deferred;
      // Set member fields
      _root = $(selector);
      _root.hide();
      if (0 < _root.children()) {
        dfd.resolve();
        return dfd.promise();
      }
      _type = type;
      _assist = typeof assist == "undefined" ? null : assist;

      // Load template data & Create form tags
      Utils.add_css("/controls/Detail/Detail.css");
      Utils.get_template("controls", "Detail", function(response) { _root_template = $.templates(response); })
      .then(function() {
        var root_html = _root_template.render(_type);
        _root.append(root_html);
      	$.when(
      	  create_form(selector),
      	  create_toolbar(selector)
        ).always(function() {
          dfd.resolve();
        });
      });
      return dfd.promise();
    };

    this.ok_func = function(func_ok) {
      _func_ok = func_ok;
    }

    this.visible = function(visible) {
      if (arguments.length == 0) {
        return _root.css("display") == "none" ? false : true;
      }
      _root.css("display", visible ? "block" : "none");
    }

    this.edit = function(on) {
      if (on) {
        _toolbar.button("edit").hide();
        _toolbar.button("delete").hide();
        _toolbar.button("save").show();
        _toolbar.button("cancel").show();
      } else {
        _toolbar.button("edit").show();
        _toolbar.button("delete").show();
        _toolbar.button("save").hide();
        _toolbar.button("cancel").hide();
      }
      for (var i = 0; i < _type.object_fields.length; i++) {
        var object_field = _type.object_fields[i];
        var name = object_field.name;
        _controls[name].edit(on);
      }
    };

    this.commit = function() {
      for (var i = 0; i < _type.object_fields.length; i++) {
        var object_field = _type.object_fields[i];
        var name = object_field.name;
        _controls[name].commit();
      }
    }

    this.restore = function() {
      for (var i = 0; i < _type.object_fields.length; i++) {
        var object_field = _type.object_fields[i];
        var name = object_field.name;
        _controls[name].restore();
      }
    }

    this.is_new = function() {
      return _is_new;
    };

    this.key = function() {
      var key_name = _assist.key;
      var control = _controls[key_name];
      return control.backuped();
    };
    
    this.data = function(value) {
      var data = {};
      for (var i = 0; i < _type.object_fields.length; i++) {
        var object_field = _type.object_fields[i];
        var name = object_field.name;
        var control = _controls[name];
        if (arguments.length == 0) {
          data[name] = control.data();
        } else {
          control.data(value ? value[name] : null);
        }
      }
      if (arguments.length == 0) {
        return data;
      } else {
        _is_new = false;
      }
    };
  };
});