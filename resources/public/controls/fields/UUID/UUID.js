define(function (require) { 
  require("jquery");
  require("jsrender");
  var Utils = require("core/Utils");
  return function () {
  	var _root = null;
    var _template = null;
    var _instance = this;

    function create_control(field) {
      var html = _template.render(field);
      _root.append(html);
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
      Utils.add_css("/controls/fields/UUID/UUID.css");
      Utils.get_template("controls/fields", "UUID", function(response) { _template = $.templates(response); })
      .then(function() {
        create_control(field);
        dfd.resolve();
      });
      return dfd.promise();
    };

    this.edit = function(on) {
      if (on) {
        _root.find("input").show();
        _root.find("div").hide();
      } else {
        _root.find("input").hide();
        _root.find("div").show();
      }
    };

    this.backuped = function() {
      return _root.find("div").text();
    };

    this.commit = function() {
      var value = _root.find("input").val();
      _root.find("div").text(value);
    };

    this.restore = function() {
      var value = _root.find("div").text();
      _root.find("input").val(value);
    };

    this.data = function(value) {
      if (arguments.length == 0) {
        return _root.find("input").val();
      } else {
        _root.find("input").val(value);
        _root.find("div").text(value);
      }
    };
  }; 
}); 
