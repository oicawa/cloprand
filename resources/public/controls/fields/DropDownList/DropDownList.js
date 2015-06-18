define(function (require) { 
  require("jquery");
  require("jsrender");
  var Utils = require("core/Utils");
  return function () {
  	var _root = null;
    var _template = null;
    var _items = null;
    var _instance = this;

    function create_control(field) {
      var items = {};
      for (var i = 0; i < _items.length; i++) {
        if (!_items[i].uuid) {
          _items[i].uuid = _items[i].name;
        }
      }
      var html = _template.render({ name: field.name, items: _items });
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
      //Utils.add_css("/controls/fields/DropDownList/DropDownList.css");
      $.when(
        Utils.get_template("controls/fields", "DropDownList", function(response) { _template = $.templates(response); }),
        Utils.get_data(field.datatype["class"], null, function(response) { _items = response; })
      ).then(function() {
        create_control(field);
        dfd.resolve();
      });
      return dfd.promise();
    };

    this.edit = function(on) {
      if (on) {
        _root.find("select").show();
        _root.find("div").hide();
      } else {
        _root.find("select").hide();
        _root.find("div").show();
      }
    };

    this.backuped = function() {
      return _root.find("div").text();
    };

    this.commit = function() {
      var value = _root.find("select").val();
      _root.find("div").text(value);
    };

    this.restore = function() {
      var value = _root.find("div").text();
      _root.find("select").val(value);
    };

    this.data = function(value) {
      if (arguments.length == 0) {
        return _root.find("select").val();
      } else {
        _root.find("select").val(value);
        _root.find("div").text(value);
      }
    };
  }; 
}); 
