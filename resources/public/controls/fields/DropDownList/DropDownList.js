define(function (require) { 
  require("jquery");
  require("jsrender");
  var Utils = require("core/Utils");
  
  function DropDownList() {
  	this._editor = null;
  	this._viewer = null;
    this._template = null;
    this._class = null;
    this._objects = null;
    this._items = {};
  }

  function create_control(self, root, template, field) {
    var caption_fields = [];
    if (!self._class.object_fields) {
      self._class.object_fields = [];
    }
    for (var i = 0; i < self._class.object_fields.length; i++) {
      var object_field = self._class.object_fields[i];
      if (!object_field.caption) {
        continue;
      }
      caption_fields.push(object_field.name);
    }

    var items = [];
    items.push({uuid: "", label: ""});
    for (var i = 0; i < self._objects.length; i++) {
      var item = self._objects[i];
      var captions = [];
      for (var j = 0; j < caption_fields.length; j++) {
        var value = item[caption_fields[j]];
        captions.push(value);
      }
      var value = !item.uuid ? item[caption_fields[0]] : item.uuid;
      var caption = captions.join(" ");
      items.push({value : value, caption : caption });
      self._items[value] = caption;
    }
    
    var html = template.render({ name: field.name, items: items });
    root.append(html);
    
    self._editor = root.find("select");
    self._viewer = root.find("div");
  }

  DropDownList.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    // Set member fields
    var root = $(selector);
    if (0 < root.children()) {
      dfd.resolve();
      return dfd.promise();
    }

    // Load template data & Create form tags
    //Utils.add_css("/controls/fields/DropDownList/DropDownList.css");
    var self = this;
    var template = null;
    var class_id = field.datatype["class"];
    $.when(
      Utils.get_template("controls/fields", "DropDownList", function(response) { template = $.templates(response); }),
      Utils.get_data(Utils.CLASS_UUID, class_id, function(response) { self._class = response; }),
      Utils.get_data(class_id, null, function(response) { self._objects = response; })
    ).then(function() {
      create_control(self, root, template, field);
      dfd.resolve();
    });
    return dfd.promise();
  };

  DropDownList.prototype.edit = function(on) {
    if (on) {
      this._editor.show();
      this._viewer.hide();
    } else {
      this._editor.hide();
      this._viewer.show();
    }
  };

  DropDownList.prototype.backuped = function() {
    return this._viewer.attr("value");
  };

  DropDownList.prototype.commit = function() {
    var value = this._editor.val();
    this._viewer.text(this._items[value]);
    this._viewer.attr("value", value);
  };

  DropDownList.prototype.restore = function() {
    var value = this._viewer.attr("value");
    this._editor.val(value);
  };

  DropDownList.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._editor.val();
    } else {
      this._editor.val(value);
      this._viewer.text(this._items[value]);
      this._viewer.attr("value", value);
    }
  };

  return DropDownList;
}); 
