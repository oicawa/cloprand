define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Inherits = require("core/Inherits");
  var Class = require("core/Class");
  var Storage = require("core/Storage");
  var Grid = require("core/Control/Grid");
  var DivButton = require("core/Control/DivButton");
  var Field = require("core/Control/Field/Field");
  
  var TEMPLATE = '<label></label><div><input style="color:black;"/><div name="button"/></div>';

  function show_languages_dialog(self) {
    alert("Run show_languages_dialog");
    /*
    // Grid
    var class_ = null;
    var items = null;
    var columns = null;
    Storage.read(Class.CLASS_ID, Class.LOCALE_ID)
    .then(function(data) {
      class_ = data;
    })
    .then(function () {
      return Storage.read(Class.LOCALE_ID).then(function(objects) { items = objects; })
    })
    .then(function () {
      return Grid.create_columns(class_).then(function (columns_) { columns = columns_; });
    })
    .then(function () {
      function converter(objects) {
        return (new Class(class_)).captions(objects);
      }
      var finder_selector = selector + " > div > div[name='languages']";
      self._finder = new Finder();
      return self._finder.init(finder_selector, columns, items, "", false, converter, "fa-globe");
    })
    .then(function () {
      self.edit(false);
      dfd.resolve();
    });
    */
  }
  
  function Text() {
    Field.call(this, "core/Control/Field", "Text");
    this._input = null;
    this._value = null;
    this._draft = null;
    this._properties = null;
    this._button = null;
  };
  Inherits(Text, Field);
  
  Text.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    
    var root = $(selector);
    root.append(TEMPLATE);

    // properties
    this._properties = Utils.value(
      { width : 200, is_require : false, default_ : "", multi_lingualization : false },
      function() { return field.datatype.properties; },
      false);
    var self = this;
    
    // Label
    var label = root.find("label");
    var caption = field.label;
    label.text(caption);

    // Input
    self._input = root.find("input");
    self._input.attr("name", field.name);
    self._input.css("width", this._properties.width);
    self._input.w2field("text");

    // If *NOT* multi-lingualize, don't create Button & Grid.
    if (!self._properties.multi_lingualization) {
      dfd.resolve();
      return dfd.promise();
    }

    // Button
    var button_selector = selector + " > div > div[name='button']";
    self._button = new DivButton();
    self._button.init(button_selector, '<i class="fa fa-globe"/>', function (event) {
      show_languages_dialog(self);
    })
    .then(function () {
      self._button.visible(false);
      dfd.resolve();
    });

    return dfd.promise();
  };

  Text.prototype.multi_lingualize = function() {
  　console.log("Implement showing dialog to multi-lingualize.");
  };

  Text.prototype.backuped = function() {
    return this._value;
  };

  Text.prototype.commit = function() {
    if (!this._properties.multi_lingualization) {
      this._value = this._input.val();
      return;
    }
    this._value = this._draft;
    this._value[""] = this._input.val();
  };

  Text.prototype.restore = function() {
    if (!this._properties.multi_lingualization) {
      this._input.val(this._value);
      return;
    }
    this._draft = this._value;
  };

  Text.prototype.edit = function(on) {
    this._input.attr("readonly", !on);
    if (!this._button) {
      return;
    }
    this._button.visible(on);
  };

  Text.prototype.data = function(value) {
  	var multi = this._properties.multi_lingualization;
    // getter
    if (arguments.length == 0) {
      if (!multi) {
        return this._input.val();
      } else {
        var v = this._draft;
        v[""] = this._input.val();
        return v;
      }
    }
    // setter
    if (!multi && Utils.is_object(value)) {
      this._value = value[""];
    } else if (multi && !Utils.is_object(value)){
      this._value = { "" : value };
    } else {
      this._value = value;
    }
    this._input.val(!multi ? this._value : this._value[""]);
  };
  
  return Text;
}); 
