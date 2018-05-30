define(function (require) {
  require("jquery");
  var Utils = require("core/Utils");
  var Css = require("core/Css");
  var Locale = require("core/Locale");
  var Uuid = require("core/Uuid");
  var Inherits = require("core/Inherits");
  var Field = require("core/Control/Field/Field");
 
  var TEMPLATE = '' +
'<div>' +
'  <div class="exist-list"></div>' +
'  <div class="added-list"></div>' +
'  <div class="attach-area">' +
'    <div class="drop-area" style="width:{{WIDTH}}px;height:{{HEIGHT}}px;">' +
'      <div style="display:table-cell;vertical-align:middle;text-align:center;"><span class="fa fa-plus"/> Click here or Drop files.</div>' +
'    </div>' +
'  </div>' +
'</div>';
  var INPUT_TEMPLATE = '<input type="file" multiple="true" style="display:none;"></input>';
  var ITEM_TEMPLATE = '' +
'<div class="file-field-item">' +
'  <a></a>' +
'  <i class="fa fa-remove" />' +
'</div>';

  function Files() {
    Field.call(this, "core/Control/Field", "Files");
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

  Files.prototype.get_default_height = function () {
    return 50;
  }

  Files.prototype.get_default_width = function () {
    return 150;
  }

  function create_field(self, selector, field) {
    var root = $(selector);
    
    self._field_name = field.name;
    self._properties = Utils.clone(field.datatype.properties);
    
    // Create form tags
    var width = self._properties.width;
    var default_width = self.get_default_width();
    width = (is_null_or_undefined(width) || width < default_width) ? default_width : width;
    self._properties.width = width;
    
    var height = self._properties.height;
    var default_height = self.get_default_height();
    height = (is_null_or_undefined(height) || height < default_height) ? default_height : height;
    self._properties.height = height;
    
    var html = TEMPLATE.replace(/{{WIDTH}}/, width).replace(/{{HEIGHT}}/, height);
    root.append(html);
    
    var tag_name = self.get_item_tag_name();
    self._exist_list = root.find("div.exist-list");
    self._exist_list.on("click", tag_name, function(event) {
      if (self._editting)
        return false;
      return true;
    });
    self._exist_list.on("click", "i", function(event) {
      var i = $(event.originalEvent.target);
      self._remove[i.attr("name")] = true;
      self.refresh();
    });
    self._added_list = root.find("div.added-list");
    self._added_list.on("click", "i", function(event) {
      var key = $(event.originalEvent.target).attr("name");
      delete self._added[key];
      self.refresh();
    });
    self._attach_area = root.find("div.attach-area");
    self._attach_area.append(INPUT_TEMPLATE);
    self._attach_area.on("change", "input", function(event) {
      self.append_files(event.originalEvent.target.files);
      self._attach_area.find("input").remove();
      self._attach_area.append(INPUT_TEMPLATE);
      self.refresh();
    });
    self._drop_area = root.find("div.drop-area");
    self._drop_area.on("click", function(event) {
      self._attach_area.find("input").click();
    });
    self._drop_area.on("drop", function(event) {
      event.preventDefault();
      event.stopPropagation();
      self.append_files(event.originalEvent.dataTransfer.files);
      self.refresh();
    });
    self._drop_area.on("dragover", function(event) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    });
    self._drop_area.on("mouseover", function(event) {
      self._drop_area.css("cursor", "pointer");
    });
    self._drop_area.on("mouseout", function(event) {
      self._drop_area.css("cursor", "auto");
    });
    root.on("mouseover", self.item_selector(), function(event) {
      if (!self._editting) {
        return;
      }
      console.log("mouseover on [" + self.item_selector() + "]");
      var i = $(event.currentTarget).find("i");
      console.log(i);
      i.css("display", "inline");
    });
    root.on("mouseout", self.item_selector(), function(event) {
      console.log("mouseout on [" + self.item_selector() + "]");
      var i = $(event.currentTarget).find("i");
      console.log(i);
      i.css("display", "none");
    });
    root.on("mouseover", "i", function(event) {
      var i = $(event.originalEvent.target);
      i.css("cursor", "pointer");
    });
    root.on("mouseout", "i", function(event) {
      var i = $(event.originalEvent.target);
      i.css("cursor", "auto");
    });
    
    self.edit(false);
  }

  Files.prototype.item_selector = function () {
    return "div.file-field-item";
  }
  
  Files.CSS = "core/Control/Field/Files.css";
  Files.prototype.css_path = function() {
    return Files.CSS;
  }
  
  Files.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    var self = this;
    Css.load(this.css_path())
    .then(function () {
      create_field(self, selector, field);
      dfd.resolve();
    });
    return dfd.promise();
  };
 
  Files.prototype.backup = function() {
    return this._values;
  };

  Files.prototype.commit = function() {
    var current = [];
    for (var i = 0; i < this._values.current.length; i++) {
      var file = this._values.current[i];
      if (this._remove[file.name]) {
        continue;
      }
      current.push(file);
    }
    
    for (var key in this._added) {
      var file = this._added[key];
      current.push(file);
    }
    
    this._values.current = current;
    this._added = {};
    this._remove = {};
  };

  Files.prototype.restore = function() {
    this._added = {};
    this._remove = {};
  };

  Files.prototype.edit = function(on) {
    this._editting = on;
    if (on)
      this.restore();
  };

  Files.prototype.data = function(value) {
    if (arguments.length == 0) {
      if (!this._values) {
        this._values = {};
        this._values.current = [];
      }
      this._values.added = this._added;
      this._values.remove = this._remove;
      return this._values;
    } else {
      this._values = value;
      this._added = {};
      this._remove = {};
    }
  };
  
  Files.prototype.update = function() {
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
  
  Files.get_count = function (self) {
    var current = self._values.current.length;
    var added = Object.keys(self._added).length;
    var removed = Object.keys(self._remove).length;
    var count = current + added - removed;
    return count;
  }
  
  Files.prototype.switch = function() {
    var tag = this.get_item_tag_name();
    if (this._editting) {
      this._exist_list.find(tag).css("text-decoration", "none");
      //this._exist_list.find("i").css("display", "inline");
      //this._added_list.find("i").css("display", "inline");
      var count = Files.get_count(this);
      var attribute = (this._properties.multiple === false && 0 < count) ? "none" : "block";
      this._attach_area.css("display", attribute);
    } else {
      this._exist_list.find(tag).css("text-decoration", "underline");
      //this._exist_list.find("i").css("display", "none");
      //this._added_list.find("i").css("display", "none");
      this._attach_area.css("display", "none");
    }
  };
  
  Files.prototype.refresh = function() {
    this._exist_list.empty();
    this._added_list.empty();
    var tag = this.get_item_tag_name();
    
    if (is_null_or_undefined(this._values)) {
      this._values = {};
    }
    if (is_null_or_undefined(this._values.current)) {
      this._values.current = [];
    }
    for (var i = 0; i < this._values.current.length; i++) {
      var file = this._values.current[i];
      if (this._remove[file.name]) {
        continue;
      }
      this._exist_list.append(this.get_item_template());
      var record = this._exist_list.find(this.item_selector() + ":last-child");
      var size = this.get_display_size(file.size);
      record.find(tag).text(file.name + " - (" + size + ")");
      record.find(tag).attr("download", file.name);
      console.log("--- this._values ---");
      console.log(this._values);
      record.find(tag).attr("href", "api/download/" + this._values.class_id + "/" + this._values.object_id + "/" + this._field_name + "/" + file.name);
      record.find("i").attr("name", file.name);
    }
   
    for (var key in this._added) {
      var file = this._added[key];
      this._added_list.append(this.get_item_template());
      var record = this._added_list.find(this.item_selector() + ":last-child");
      var size = this.get_display_size(file.size);
      record.find(tag).text(file.name + " - (" + size + ")");
      record.find("i").attr("name", key);
    }
    
    this.switch();
  };
 
  return Files;
}); 
