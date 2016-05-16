define(function (require) { 
  require("jquery");
  var Utils = require("data/Core/Utils");
  var Inherits = require("data/Core/Inherits");
  var Field = require("data/Control/Field/Field");
  
  var TEMPLATE = '' +
'<label></label>' +
'<div>' +
'  <div class="list"></div>' +
'  <div class="droparea"><input></input></div>' +
'</div>';
  var ITEM_TEMPLATE = '' +
'<div class="item" style="border:solid 1px gray;">' +
'  <div style="width:200px;"><a></a></div>' +
'  <div class="size" style="width: 50px">(<span class="size"></span><span class="unit"></span>)</size>' +
'  <i class="fa fa-remove"></i>' +
'</div>';
  
  function Files() {
    Field.call(this, "data/Control/Field", "Files");
    this._list = null;
    this._drop = null;
    this._values = [];
    this.added = [];
    this.removed = {};
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
    
    self._list = root.find("div.list");
    self._list.on("a", "click", function(event) {
      console.log("<a> clicked.");
    });
    self._list.on("i", "click", function(event) {
      console.log("<i> clicked.");
    });
    self._droparea = root.find("div.droparea");
    self._drop = root.find("input");
    self._drop.w2field("file", {style: "width:400px;"});
    
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
    this.update();
  };

  Files.prototype.edit = function(on) {
    if (on) {
      this._droparea.css("display", "block");
    } else {
      this._droparea.css("display", "none");
    }
  };

  Files.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._drop.val();
    } else {
      this._values = value;
      this.refresh();
    }
  };
  
  Files.prototype.update = function() {
    
  };
  
  Files.prototype.refresh = function() {
    //this._list.empty();
    //for (var i = 0; i < this._values.length; i++) {
    //  var value = this._values[0];
    //  this._list.append(ITEM_TEMPLATE);
    //  var item = this._list.find("div.item:last-child");
    //  item.text(item.file_name + "(" + item.file_size + "kb)");
    //  item.attr("href", item.url);
    //}
  };
  
  return Files;
}); 
