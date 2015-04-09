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
      var value = parseInt(field.datatype.substring(0, 1), 10);
      if (!isNaN(value)) {
        return "DropDownList";
      }
      return field.datatype;
    }

    function create_form(selector) {
      var root_html = _root_template.render(_type);
      _root.append(root_html);

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
          });
        };
        each_field_funcs[i](object_field);
      }
    }

    function create_toolbar(selector) {
      _toolbar = new Toolbar();
      _toolbar.init(selector + " > div.detail-operations", _assist.toolbar);
    }

    function bind_buttons() {
      // Bind 'OK' button event
      $("button.ok_button").on("click", function() {
        var data = _instance.data();
        _func_ok(data);
        _instance.data(null);
        return false;
      });
      
      // Bind 'Cancel' button event
      $("button.cancel_button").on("click", function() {
      	_instance.data(null);
        _instance.visible(false);
        return false;
      });
    }

    function get_value(control) {
      var type = control.prop("type");
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
      // Set member fields
      _root = $(selector);
      _type = type;
      _assist = typeof assist == "undefined" ? null : assist;

      // Load template data & Create form tags
      Utils.add_css("/controls/Detail/Detail.css");
      $.when(
      	Utils.get_control_template("Detail", function(response) { _root_template = $.templates(response); })
      ).always(function() {
      	create_toolbar(selector);
      	create_form(selector);
      });
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
    
    this.data = function(value) {
      var data = {};
      for (var i = 0; i < _type.object_fields.length; i++) {
        var object_field = _type.object_fields[i];
        var name = object_field.name;
        var control = _root.find("dl > dd > div." + name).children();
        if (arguments.length == 0) {
          data[name] = get_value(control);
        } else {
          set_value(control, value ? value[name] : null);
        }
      }
      if (arguments.length == 0) {
        return data;
      }
    };
  };
});