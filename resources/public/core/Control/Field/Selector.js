define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Locale = require("core/Locale");
  var Storage = require("core/Storage");
  var Inherits = require("core/Inherits");
  var Class = require("core/Class");
  var SelectDialog = require("core/Control/SelectDialog");
  var Grid = require("core/Control/Grid");
  var Finder = require("core/Control/Finder");
  var Field = require("core/Control/Field/Field");
  
  var TEMPLATE = '<label></label><div></div>';

  function Selector() {
    Field.call(this, "core/Control/Field", "Selector");
    this._finder = null;
  }
  Inherits(Selector, Field);

  Selector.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    // Set member fields
    var root = $(selector);
    if (0 < root.children()) {
      dfd.resolve();
      return dfd.promise();
    }
    
    // Create form tags
    root.empty();
    root.append(TEMPLATE);
    // Label
    var label = root.children("label");
    var caption = Locale.translate(field.label);
    label.text(caption);
    // Finder
    this._finder = new Finder();
    
    var self = this;
    var class_id = field.datatype.properties.class_id;
    var description = field.datatype.properties.description;
    var multi_selectable = field.datatype.properties.multi_selectable;
    var class_ = null;
    var columns = null;
    var items = null;
    console.assert(!(!class_id), field);
    Utils.load_css("/core/Control/Field/Selector.css")
    .then(function () {
      return Storage.read(Class.CLASS_ID, class_id).then(function(data) { class_ = data; });
    })
    .then(function () {
      return Storage.read(class_id).then(function(objects) { items = objects; })
    })
    .then(function () {
      return Grid.create_columns(class_).then(function (columns_) { columns = columns_; });
    })
    .then(function() {
      function converter(objects) {
        return (new Class(class_)).captions(objects);
      }
      return self._finder.init(selector + " > div", columns, items, description, multi_selectable, converter);
    })
    .then(function() {
      self.edit(false);
      dfd.resolve();
    });
    return dfd.promise();
  };
  
  Selector.prototype.edit = function(on) {
    this._finder.edit(on);
  };

  Selector.prototype.backuped = function() {
    return this._finder.backuped();
  };

  Selector.prototype.commit = function() {
    this._finder.commit();
  };

  Selector.prototype.restore = function() {
    this._finder.restore();
  };

  Selector.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._finder.data();
    }
    this._finder.data(value);
    this.refresh();
  };
  
  Selector.prototype.update = function(keys) {
  
  };
  
  Selector.prototype.refresh = function() {
    this._finder.refresh();
  };

  Selector.cell_render = function(field) {
    var dfd = new $.Deferred;
    var class_id = field.datatype.properties.class_id;
    Finder.cell_render(class_id)
    .done(function (renderer) {
      dfd.resolve(renderer);
    });
    return dfd.promise();
  };
  
  return Selector;
}); 
