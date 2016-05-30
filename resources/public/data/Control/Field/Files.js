define(function (require) {
  require("jquery");
  var Utils = require("data/Core/Utils");
  var Uuid = require("data/Core/Uuid");
  var Inherits = require("data/Core/Inherits");
  var Field = require("data/Control/Field/Field");
 
  var TEMPLATE = '' +
'<label></label>' +
'<div>' +
'  <div class="exist-list"></div>' +
'  <div class="added-list"></div>' +
'  <div class="attach-area">' +
'    <div class="drop-area" style="display:table;width:300px;height:50px;border:dashed 2px gray;border-radius:3px;font-family:Verdana,Arial,sans-serif;font-size:12px;">' +
'      <div style="display:table-cell;vertical-align:middle;text-align:center;"><span class="fa fa-plus"/> Click here or Drop files.</div>' +
'    </div>' +
'  </div>' +
'</div>';
  var INPUT_TEMPLATE = '<input type="file" multiple="true" style="display:none;"></input>';
  var ITEM_TEMPLATE = '' +
'<div class="item" style="margin:2px 0px;">' +
'  <a style="display:inline-block;border:solid 1px gray;border-radius:3px;background-color:#f0f0f0;padding:2px 5px 2px 5px;font-family:Verdana,Arial,sans-serif;font-size:12px;min-width:300px;"></a>' +
'  <i class="fa fa-remove" />' +
'</div>';

  function Files() {
    Field.call(this, "data/Control/Field", "Files");
    this._field_name = null;
    this._editting = false;
    this._exist_list = null;
    this._added_list = null;
    this._attach_area = null;
    this._input = null;
    this._drop_area = null;
    this._values = {};
    this._added = {};
    this._remove = {};
  };
  Inherits(Files, Field);
  
  Files.prototype.append_files = function(files) {
    var self = this;
    var currents = this._values.current.filter(function (current) { return !self._remove[current.name]; }).map(function (current) { return current.name; });
    var added = Object.keys(this._added).map(function (key) { return self._added[key].name; });
    var names = currents.concat(added);
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var exists = names.some(function (name) { return name == file.name; });
      if (exists)
        continue;
      var key = "file_" + Uuid.version4();
      this._added[key] = file;
    }
  }

  Files.prototype.get_item_template = function() {
    return ITEM_TEMPLATE;
  };
  
  Files.prototype.get_item_tag_name = function() {
    return "a";
  };
  
  Files.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    var root = $(selector);
    
    this._field_name = field.name;
    
    // Create form tags
    var self = this;
   
    root.append(TEMPLATE);
    var label = root.find("label");
    var caption = field.label;
    label.text(caption);
   
    this._exist_list = root.find("div.exist-list");
    this._exist_list.on("click", this.get_item_tag_name(), function(event) {
      if (self._editting)
        return false;
      return true;
    });
    this._exist_list.on("click", "i", function(event) {
      var i = $(event.originalEvent.target);
      self._remove[i.attr("name")] = true;
      self.refresh();
    });
    this._added_list = root.find("div.added-list");
    this._added_list.on("click", "i", function(event) {
      var key = $(event.originalEvent.target).attr("name");
      delete self._added[key];
      self.refresh();
    });
    this._attach_area = root.find("div.attach-area");
    this._attach_area.append(INPUT_TEMPLATE);
    this._attach_area.on("change", "input", function(event) {
      self.append_files(event.originalEvent.target.files);
      self._attach_area.find("input").remove();
      self._attach_area.append(INPUT_TEMPLATE);
      self.refresh();
    });
    this._drop_area = root.find("div.drop-area");
    this._drop_area.on("click", function(event) {
      self._attach_area.find("input").click();
    });
    this._drop_area.on("drop", function(event) {
      event.preventDefault();
      event.stopPropagation();
      self.append_files(event.originalEvent.dataTransfer.files);
      self.refresh();
    });
    this._drop_area.on("dragover", function(event) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    });
    this._drop_area.on("mouseover", function(event) {
      self._drop_area.css("cursor", "pointer");
    });
    this._drop_area.on("mouseout", function(event) {
      self._drop_area.css("cursor", "auto");
    });
    root.on("mouseover", "i", function(event) {
      var i = $(event.originalEvent.target);
      i.css("cursor", "pointer");
    });
    root.on("mouseout", "i", function(event) {
      var i = $(event.originalEvent.target);
      i.css("cursor", "auto");
    });
    
    this.edit(false);
    
    dfd.resolve();
    return dfd.promise();
  };
 
  Files.prototype.backuped = function() {
    return this._values;
  };

  Files.prototype.commit = function() {
    this._values.added = this._added;
    this._values.remove = this._remove;
    this._added = {};
    this._remove = {};
  };

  Files.prototype.restore = function() {
    this._added = {};
    this._remove = {};
  };

  Files.prototype.edit = function(on) {
    console.log("Files field edit " + (on ? "**ON**" : "**OFF**"));
    this._editting = on;
    if (on)
      this.restore();
    this.refresh();
  };

  Files.prototype.data = function(value) {
    if (arguments.length == 0) {
      if (!this._values)
        this._values = {};
      this._values.added = this._added;
      this._values.remove = this._remove;
      this._values.current = !value ? [] : (!value.current ? [] : value.current);
      return this._values;
    } else {
      this._values = value;
      this.refresh();
    }
  };
  
  Files.prototype.update = function() {
    console.log("*** Files field updated.");
  };
  Files.prototype.get_display_size = function(real_size) {
    var size = 0.0 + real_size;
    var units = ["Byte", "KB", "MB"];
    var unit = null;
    for (var i = 0; i < units.length; i++) {
      var unit = units[i];
      if (size < 1000.0)
        break;
      size = size / 1000.0;
    }
    return size.toFixed(1) + " " + unit;
  };
  
  Files.prototype.switch = function() {
    var tag = this.get_item_tag_name();
    if (this._editting) {
      this._exist_list.find(tag).css("text-decoration", "none");
      this._exist_list.find("i").css("display", "inline");
      this._added_list.find("i").css("display", "inline");
      this._attach_area.css("display", "block");
    } else {
      this._exist_list.find(tag).css("text-decoration", "underline");
      this._exist_list.find("i").css("display", "none");
      this._added_list.find("i").css("display", "none");
      this._attach_area.css("display", "none");
    }
  };
  
  Files.prototype.refresh = function() {
    this._exist_list.empty();
    this._added_list.empty();
    var tag = this.get_item_tag_name();
    
    if (!this._values) this._values = {};
    if (!this._values.current) this._values.current = [];
    for (var i = 0; i < this._values.current.length; i++) {
      var file = this._values.current[i];
      if (this._remove[file.name]) {
        continue;
      }
      this._exist_list.append(this.get_item_template());
      var record = this._exist_list.find("div.item:last-child");
      var size = this.get_display_size(file.size);
      record.find(tag).text(file.name + " - (" + size + ")");
      record.find(tag).attr("download", file.name);
      record.find(tag).attr("href", "download/" + this._values.class_id + "/." + this._values.object_id + "/" + this._field_name + "/" + file.name);
      record.find("i").attr("name", file.name);
    }
   
    for (var key in this._added) {
      var file = this._added[key];
      this._added_list.append(this.get_item_template());
      var record = this._added_list.find("div.item:last-child");
      var size = this.get_display_size(file.size);
      record.find(tag).text(file.name + " - (" + size + ")");
      record.find("i").attr("name", key);
    }
    
    this.switch();
    
    console.log("*** Files field refreshed.");
  };
 
  return Files;
}); 
