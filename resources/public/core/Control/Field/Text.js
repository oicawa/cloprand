define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Inherits = require("core/Inherits");
  var Class = require("core/Class");
  var Storage = require("core/Storage");
  var Dialog = require("core/Dialog");
  var Grid= require("core/Control/Grid");
  var List = require("core/Control/List");
  var DivButton = require("core/Control/DivButton");
  var Field = require("core/Control/Field/Field");
  
  function show_languages_dialog(self, locale, locales, columns) {
    if (!self._draft) {
      self._draft = {};
    }
    var items = Object.keys(self._draft).map(function(locale_id) { return { "id" : locale_id, "text" : self._draft[locale_id] }; });
    var list = new List();
    var dialog = new Dialog();
    dialog.init(function(contents_id) {
      return list.init("#" + contents_id, { class_id : self.detail_id(), width : 300, height : 400});
    })
    .then(function () {
      list.data(items);
      list.edit(true);
      list.refresh();
    })
    .then(function () {
      dialog.title("Locales");
      dialog.buttons([
        { text: "OK",    click:function (event) { alert("Clicked OK button."); dialog.close(); } },
        { text:"Cancel", click:function (event) { dialog.close(); }}
      ]);
      dialog.size(300, 400);
      dialog.open();
    });
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

  Text.prototype.template = function() {
    return '<label></label><div><input style="color:black;"/><div name="button"/></div>';
  };

  Text.prototype.create_form = function(root, field_name) {
    this._input = root.find('input');
    this._input.attr("name", field_name);
    this._input.css("width", this._properties.width);
    this._input.w2field("text");
  };

  var DEFAULT_PROPERTIES = { width : 200, is_require : false, default_ : "", multi_lingualization : false };
  Text.prototype.default_properties = function() {
    return DEFAULT_PROPERTIES;
  };
  
  Text.prototype.detail_id = function() {
    return Class.TEXT_MULTILINGUALIZATION_ID;
  };
  
  Text.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    
    var root = $(selector);
    root.append(this.template());

    // properties
    this._properties = Utils.object(
      this.default_properties(),
      function() { return field.datatype.properties; },
      false);
    var self = this;
    
    // Label
    var label = root.find("label");
    var caption = field.label;
    label.text(caption);

    // Input
    this.create_form(root, field.name);

    // If *NOT* multi-lingualize, don't create Button
    if (!self._properties.multi_lingualization) {
      dfd.resolve();
      return dfd.promise();
    }

    // Get Locale data
    var locale = null;
    var locales = null;
    var columns = null;
    Storage.read(Class.CLASS_ID, Class.LOCALE_ID)
    .then(function(data) {
      locale = data;
    })
    .then(function () {
      return Storage.read(Class.LOCALE_ID).then(function(objects) { locales = objects; })
    })
    .then(function () {
      return Grid.create_columns(locale).then(function (columns_) { columns = columns_; });
    })
    .then(function () {
      // Button
      var button_selector = selector + " > div > div[name='button']";
      self._button = new DivButton();
      return self._button.init(button_selector, '<i class="fa fa-globe"/>', function (event) {
        show_languages_dialog(self, locale, locales, columns);
      });
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
    this._value = !this._draft ? {} : this._draft;
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
        var v = !this._draft ? {} : this._draft;
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
  
  Text.cell_render = function(field) {
    var props = Utils.object(DEFAULT_PROPERTIES, function() { return field.datatype.properties; });

    var dfd = new $.Deferred;
    var renderer = function(record, index, column_index) {
      var value = record[field.name];
      if (Utils.is_object(value) && props.multi_lingualization) {
        return Utils.localed(value);
      } else {
        return value;
      }
    };
    dfd.resolve(renderer);
    return dfd.promise();
  };

  return Text;
}); 
