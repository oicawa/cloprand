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

    function editor(value) {
      var editor = _root.find("div.editor");
      var datatype = editor.find("span.datatype > select[name='datatype']");
      var detail = editor.find("span.datatype-detail");
      var class_id = detail.find("select[name='class-id']");
      var list = detail.find("input[name='multi']");
      var embeded = detail.find("input[name='embeded']");
      if (arguments.length == 0) {
        // getter
        return {
          "datatype": datatype.val(),
          "class_id": class_id.val(),
          "list": list.val(),
          "embeded": embeded.val()
        };
      } else {
        // setter
        datatype.val(value.datatype);
        class_id.val(value.class_id);
        list.val(value.list);
        embeded.val(value.embeded);
      }
    }

    function renderer(value) {
      var renderer = _root.find("div.renderer");
      var datatype = renderer.find("span.datatype > span[name='datatype']");
      var detail = renderer.find("span.datatype-detail");
      var class_id = detail.find("span[name='class-id']");
      var list = detail.find("input[name='multi']");
      var embeded = detail.find("input[name='embeded']");
      if (arguments.length == 0) {
        // getter
        return {
          "datatype": datatype.text(),
          "class_id": class_id.text(),
          "list": list.val(),
          "embeded": embeded.val()
        };
      } else {
        // setter
        datatype.text(value.datatype);
        class_id.text(value.class_id);
        list.val(value.list);
        embeded.val(value.embeded);
      }
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
      Utils.add_css("/controls/fields/FieldType/FieldType.css");
      Utils.get_template("controls/fields", "FieldType", function(response) { _template = $.templates(response); })
      .then(function() {
        create_control(field);
        dfd.resolve();
      });
      return dfd.promise();
    };

    this.edit = function(on) {
      if (on) {
        _root.find("div.editor").show();
        _root.find("div.renderer").hide();
      } else {
        _root.find("div.editor").hide();
        _root.find("div.renderer").show();
      }
    };

    this.backuped = function() {
      return renderer();
    };

    this.commit = function() {
      var value = editor();
      renderer(value);
    };

    this.restore = function() {
      var value = renderer();
      editor(value);
    };

    this.data = function(value) {
      if (arguments.length == 0) {
        return editor();
      } else {
        editor(value);
        renderer(value);
      }
    };
  }; 
}); 
