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
'    <input type="file" multiple="true" style="display:none;"></input>' +
'    <div class="drop-area" style="display:table;width:300px;height:50px;border:dashed 2px gray;border-radius:3px;font-family:Verdana,Arial,sans-serif;font-size:12px;">' +
'      <div style="display:table-cell;vertical-align:middle;text-align:center;"><span class="fa fa-plus"/> Click here or Drop files.</div>' +
'    </div>' +
'  </div>' +
'</div>';
  var ITEM_TEMPLATE = '' +
'<div class="item" style="border:solid 1px gray;">' +
'  <div style="width:200px;"><a></a></div>' +
'  <div class="size" style="width: 50px"> - (<span class="size"></span><span class="unit"></span>)</size>' +
'  <i class="fa fa-remove"></i>' +
'</div>';
  var ADDED_ITEM_TEMPLATE = '' +
'<div class="item" style="margin:2px 0px;">' +
'  <span style="display:inline-block;border:solid 1px gray;border-radius:3px;background-color:#f0f0f0;padding:2px 5px 2px 5px;font-family:Verdana,Arial,sans-serif;font-size:12px;min-width:300px;"></span>' +
'  <i class="fa fa-remove" />' +
'</div>';

  function append_files(self, files) {
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var key = "file_" + Uuid.version4();
      self._added[key] = file;
    }
  }

  function Files() {
    Field.call(this, "data/Control/Field", "Files");
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
 
  Files.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    var root = $(selector);

    // Create form tags
    var self = this;
   
    root.append(TEMPLATE);
    var label = root.find("label");
    var caption = field.label;
    label.text(caption);
   
    this._exist_list = root.find("div.exist-list");
    this._exist_list.on("a", "click", function(event) {
      console.log("<a> clicked.");
    });
    this._exist_list.on("click", "i", function(event) {
      console.log("<i> clicked.");
    });
    this._added_list = root.find("div.added-list");
    this._added_list.on("a", "click", function(event) {
      console.log("<a> clicked.");
    });
    this._added_list.on("click", "i", function(event) {
      var key = $(event.originalEvent.target).attr("name");
      delete self._added[key];
      self.refresh();
    });
    this._attach_area = root.find("div.attach-area");
    this._input = root.find("input");
    this._input.on("change", function(event) {
      append_files(self, event.originalEvent.target.files);
      self.refresh();
    });
    this._drop_area = root.find("div.drop-area");
    this._drop_area.on("click", function(event) {
      self._input.click();
    });
    this._drop_area.on("drop", function(event) {
      event.preventDefault();
      event.stopPropagation();
      append_files(self, event.originalEvent.dataTransfer.files);
      self.refresh();
    });
    this._drop_area.on("dragover", function(event) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    });
   
    dfd.resolve();
    return dfd.promise();
  };
 
  function get_values(self) {
    var items = self._list.find("div.item");
    var values = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var value = {
        file_name: item.find("a").text(),
        file_size: parseInt(item.find("span.size").text()),
        file_url : item.find("a").attr("href")
      };
      values.push(value);
    }
    return values;
  }

  Files.prototype.backuped = function() {
    return this._values;
  };

  Files.prototype.commit = function() {
    //this._values = this._input.val();
  };

  Files.prototype.restore = function() {
    this._added = {};
    this._remove = {};
  };

  Files.prototype.edit = function(on) {
    if (on) {
      this._attach_area.css("display", "block");
      this.restore();
    } else {
      this._attach_area.css("display", "none");
    }
  };

  Files.prototype.data = function(value) {
    if (arguments.length == 0) {
      if (!this._values)
        this._values = {};
      this._values.added = this._added;
      this._values.remove = this._remove;
      return this._values;
    } else {
      this._values = value;
      this.refresh();
    }
  };
 
  Files.prototype.update = function() {
   
  };
 
  Files.prototype.refresh = function() {
    this._exist_list.empty();
    this._added_list.empty();
   
    //var current = this._values.current;
    //for (var key in current) {
    //  var value = current[key];
    //  this._list.append(ITEM_TEMPLATE);
    //  var item = this._list.find("div.item:last-child");
    //  item.text(item.file_name + "(" + item.file_size + "kb)");
    //  item.attr("href", item.url);
    //}
   
    for (var key in this._added) {
      var file = this._added[key];
      this._added_list.append(ADDED_ITEM_TEMPLATE);
      var record = this._added_list.find("div.item:last-child");
      var size = file.size;
      var unit = ["Byte", "KB", "MB"];
      for (var i = 0; i < unit.length; i++) {
        size = size < 1000 ? size : size / 1000;
      }
      size = size < 1000 ? size : size / 1000;
      record.find("span").text(file.name + " - (" + file.size + " Byte)");
      record.find("i").attr("name", key);
    }
  };
 
  return Files;
}); 
