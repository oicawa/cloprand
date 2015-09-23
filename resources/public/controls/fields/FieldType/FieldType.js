define(function (require) { 
  require("jquery");
  require("jsrender");
  var Utils = require("core/Utils");
  var Inherits = require("core/Inherits");
  var Field = require("controls/fields/Field");

  function create_control(self, field) {
    var html = self._template.render(field);
    self._root.append(html);
  }

  function editor(self, value) {
    var editor = self._root.find("div.editor");
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
        "list": list.val() == "on" ? true : false,
        "embeded": embeded.val() == "on" ? true : false
      };
    } else {
      // setter
      datatype.val(value.datatype);
      class_id.val(value.class_id);
      list.val(value.list ? "on" : "off");
      embeded.val(value.embeded ? "on" : "off");
    }
  }

  function renderer(self, value) {
    var renderer = self._root.find("div.renderer");
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
        "list": list.val() == "on" ? true : false,
        "embeded": embeded.val() == "on" ? true : false
      };
    } else {
      // setter
      datatype.text(value.datatype);
      class_id.text(value.class_id);
      list.val(value.list ? "on" : "off");
      embeded.val(value.embeded ? "on" : "off");
    }
  }
  
  function FieldType() {
    Field.call(this, "controls/fields", "FieldType");
  	this._root = null;
    this._template = null;
  }
  Inherits(FieldType, Field);

  FieldType.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    // Set member fields
    this._root = $(selector);
    if (0 < this._root.children()) {
      dfd.resolve();
      return dfd.promise();
    }
    var self = this;

    // Load template data & Create form tags
    Utils.get_template("controls/fields", "FieldType", function(response) { self._template = $.templates(response); })
    .then(function() {
      create_control(self, field);
      dfd.resolve();
    });
    return dfd.promise();
  };

  FieldType.prototype.edit = function(on) {
    if (on) {
      this._root.find("div.editor").show();
      this._root.find("div.renderer").hide();
    } else {
      this._root.find("div.editor").hide();
      this._root.find("div.renderer").show();
    }
  };

  FieldType.prototype.backuped = function() {
    return renderer(this);
  };

  FieldType.prototype.commit = function() {
    var value = editor();
    renderer(this, value);
  };

  FieldType.prototype.restore = function() {
    var value = renderer(this);
    editor(this, value);
  };

  FieldType.prototype.data = function(value) {
    if (arguments.length == 0) {
      return editor(this);
    } else {
      editor(this, value);
      renderer(this, value);
    }
  };

  return FieldType;
}); 
