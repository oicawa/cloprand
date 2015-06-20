define(function (require) { 
  require("jquery");
  require("jsrender");
  var Utils = require("core/Utils");
  return function () {
  	var _root = null;
    var _template = null;
    var _instance = this;
    var _editor = null;
    var _renderer = null;

    function parse_value(value) {
      // false, 0, null, undefined
      if (!value) {
        return false;
      }
      // Exist some type data (without string)
      if (typeof value != 'string') {
        return true;
      }
      // parse string data
      if (value == "" || value == "0" || value.toLowerCase() == "false") {
        return false;
      } else {
        return true;
      }
    }

    function checked(control, value) {
      if (arguments.length == 1) {
        var val = control.find("input").prop("checked");
        return parse_value(val);
      }
      if (arguments.length != 2) {
        cosole.assert("argument length is illegal.");
        return;
      }
      control.find("input").prop("checked", parse_value(value));
    }

    function create_control(field) {
      var html = _template.render(field);
      _root.append(html);
      _editor = _root.find("div.editor");
      _renderer = _root.find("div.renderer");
    }

    this.init = function(selector, field) {
      var dfd = new $.Deferred;
      // Set member fields
      _root = $(selector);
      if (0 < _root.children()) {
        dfd.resolve();
        return dfd.promise();
      }

      // Load template data & Create form tags
      Utils.add_css("/controls/fields/Boolean/Boolean.css");
      Utils.get_template("controls/fields", "Boolean", function(response) { _template = $.templates(response); })
      .then(function() {
        create_control(field);
        dfd.resolve();
      });
      return dfd.promise();
    };

    this.edit = function(on) {
      if (on) {
        _editor.show();
        _renderer.hide();
      } else {
        _editor.hide();
        _renderer.show();
      }
    };

    this.backuped = function() {
      var value = checked(_editor);
      return checked(_renderer, value);
    };

    this.commit = function() {
      var value = checked(_editor);
      checked(_renderer, value);
    };

    this.restore = function() {
      var value = checked(_renderer);
      checked(_editor, value);
    };

    this.data = function(value) {
      if (arguments.length == 0) {
        return checked(_editor);
      } else {
        checked(_editor, value);
        checked(_renderer, value);
      }
    };
  }; 
}); 
