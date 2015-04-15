define(function (require) { 
  require("jquery");
  require("jsrender");
  var Utils = require("core/Utils");
  var Toolbar = require("controls/Toolbar/Toolbar");
  return function () {
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
    
    function get_control_name(field, assist) {
      if (assist && assist["control"]) {
        return _assist[field.name]["control"];
      }
      var is_list = field.list;
      if (is_list) {
        return "List";
      }
      var match = Utils.UUID.test(field.datatype);
      if (match) {
        return "DropDownList";
      }
      return field.datatype;
    }

    function create_form(selector) {
      // Declare 'each_field_funcs' array to closing each require 'Controls' & callback process
      var each_field_funcs = [];
      for (var i = 0; i < _type.object_fields.length; i++) {
        var object_field = _type.object_fields[i];
        each_field_funcs[i] = function(field) {
          var assist = get_control_assist(field);
          var control_name = get_control_name(field, assist);
          require(["controls/" + control_name + "/" + control_name], function(Control) {
            var control = new Control();
            control.init(selector + " > dl > dd > div." + field.name, field, assist);
            _controls[field.name] = control;
          });
        };
        each_field_funcs[i](object_field);
      }
    }

    function create_toolbar(selector) {
      _toolbar = new Toolbar(_instance);
      _toolbar.init(selector + " > div.detail-operations", _assist.toolbar);
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
      if (0 < _root.children()) {
        dfd.resolve();
        return dfd.promise();
      }
      _type = type;
      _assist = typeof assist == "undefined" ? null : assist;

      // Load template data & Create form tags
      Utils.add_css("/controls/Detail/Detail.css");
      $.when(
      	Utils.get_control_template("Detail", function(response) { _root_template = $.templates(response); })
      ).always(function() {
        var root_html = _root_template.render(_type);
        _root.append(root_html);
      	create_toolbar(selector);
      	create_form(selector);
        dfd.resolve();
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
    }
    
    this.data = function(value) {
      var data = {};
      for (var i = 0; i < _type.object_fields.length; i++) {
        var object_field = _type.object_fields[i];
        var name = object_field.name;
        var control = _controls[name];
        if (arguments.length == 0) {
          data[name] = control.data();
        } else {
          controls.data(value ? value[name] : null);
        }
      }
      if (arguments.length == 0) {
        return data;
      }
    };
  };
});