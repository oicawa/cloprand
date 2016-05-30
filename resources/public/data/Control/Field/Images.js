define(function (require) {
  require("jquery");
  var Utils = require("data/Core/Utils");
  var Uuid = require("data/Core/Uuid");
  var Inherits = require("data/Core/Inherits");
  var Field = require("data/Control/Field/Field");
  var Files = require("data/Control/Field/Files");
  
  var ITEM_TEMPLATE = '' +
'<div class="item" style="margin:2px 0px;">' +
'  <img style="display:inline-block;border:solid 1px gray;border-radius:3px;background-color:#f0f0f0;padding:2px 5px 2px 5px;font-family:Verdana,Arial,sans-serif;font-size:12px;max-width:250px;max-height:250px;"></img>' +
'  <i class="fa fa-remove" />' +
'</div>';
  
  function Images() {
    Files.call(this, "data/Control/Files", "Images");
  };
  Inherits(Images, Files);
  
  Images.prototype.get_item_template = function() {
    return ITEM_TEMPLATE;
  };
  
  Images.prototype.get_item_tag_name = function() {
    return "img";
  };
  
  Images.prototype.draw_image = function (file, image) {
    var reader = new FileReader();
    reader.onload = function() {
      image.attr('src', reader.result);
    }
    reader.readAsDataURL(file);
  };
  
  Images.prototype.data = function(value) {
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
  
  Images.prototype.refresh = function() {
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
      record.find(tag).attr("src", "data/" + this._values.class_id + "/." + this._values.object_id + "/" + this._field_name + "/" + file.name);
      record.find("i").attr("name", file.name);
    }
    
    for (var key in this._added) {
      var file = this._added[key];
      this._added_list.append(this.get_item_template());
      var record = this._added_list.find("div.item:last-child");
      var size = this.get_display_size(file.size);
      var image = record.find(tag);
      image.text(file.name + " - (" + size + ")");
      record.find("i").attr("name", key);
      this.draw_image(file, image);
    }
    
    this.switch();
    
    console.log("*** Images field refreshed.");
  };
  
  return Images;
}); 
