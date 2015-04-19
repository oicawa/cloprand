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

      // Load template data & Create form tags
      Utils.add_css("/controls/TextLines/TextLines.css");
      Utils.get_control_template("TextLines", function(response) { _template = $.templates(response); })
      .then(function() {
        create_control(field);
        dfd.resolve();
      });
      return dfd.promise();
    };

    this.edit = function(on) {
      if (on) {
        _root.find("textarea").show();
        _root.find("div").hide();
      } else {
        _root.find("textarea").hide();
        _root.find("div").show();
      }
    };

    this.backuped = function() {
      return _root.find("div").text();
    };

    this.commit = function() {
      var value = _root.find("textarea").val();
      _root.find("div").text(value);
    };

    this.restore = function() {
      var value = _root.find("div").text();
      _root.find("textarea").val(value);
    };

    this.data = function(value) {
      if (arguments.length == 0) {
        return _root.find("textarea").val();
      } else {
        _root.find("textarea").val(value);
        _root.find("div").text(value);
      }
    };
  }; 
}); 
