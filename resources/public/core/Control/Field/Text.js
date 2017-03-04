define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Locale = require("core/Locale");
  var Inherits = require("core/Inherits");
  var Class = require("core/Class");
  var Storage = require("core/Storage");
  var Dialog = require("core/Dialog");
  var Grid= require("core/Control/Grid");
  var List = require("core/Control/List");
  var DivButton = require("core/Control/DivButton");
  var Field = require("core/Control/Field/Field");

  function save_as_draft(self, list) {
    var data = {};
    list.data().forEach(function (item) {
      data[item.locale] = item.value;
    });
    self._draft = data;
    self.refresh();
  }
  
  function show_languages_dialog(self, locale, locales, columns) {
    if (!self._draft) {
      self._draft = self._value;
    }
    var items = Object.keys(self._draft).map(function(locale_id) { return { "id" : locale_id, "locale": locale_id, "value" : self._draft[locale_id] }; });
    var list = new List();
    var dialog = new Dialog();
    dialog.init(function(contents_id) {
      return list.init("#" + contents_id, { class_id : self.detail_id(), width : null, height : null});
    })
    .then(function () {
      list.data(items);
      list.edit(true);
      list.refresh();
    })
    .then(function () {
      dialog.title("Locales");
      dialog.buttons([
        { text: "OK",    click:function (event) { save_as_draft(self, list); dialog.close(); } },
        { text:"Cancel", click:function (event) { dialog.close(); }}
      ]);
      dialog.size(400, 300);
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

  Text.DEFAULT_PROPERTIES = { "width" : 200, "is_require" : false, "default" : "", "multi_lingualization" : false };
  Text.prototype.default_properties = function() {
    return Text.DEFAULT_PROPERTIES;
  };
  
  Text.prototype.detail_id = function() {
    return Class.TEXT_MULTILINGUALIZATION_ID;
  };
  
  Text.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    
    var root = $(selector);
    root.append(this.template());

    // properties
    this._properties = Utils.get_as_json(
      this.default_properties(),
      function() { return field.datatype.properties; },
      false);
    var self = this;
    
    // Label
    var label = root.find("label");
    var caption = Locale.translate(field.label);
    label.text(caption);

    // Input
    this.create_form(root, field.name);

    // If *NOT* multi-lingualize, do not create Button
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

  Text.prototype.backuped = function() {
    return this._value;
  };

  Text.prototype.commit = function() {
    if (!this._properties.multi_lingualization) {
      this._value = this._input.val();
      return;
    }
    this._value = !this._draft ? {} : this._draft;
  };

  Text.prototype.restore = function() {
    if (!this._properties.multi_lingualization) {
      this._input.val(this._value);
      return;
    }
    this._draft = this._value;
  };

  Text.prototype.edit = function(on) {
    if (!this._button) {
      this._input.attr("readonly", !on);
      return;
    } else {
      this._input.attr("readonly", true);
      this._button.visible(on);
    }
  };

  Text.prototype.data = function(value) {
    var multi = this._properties.multi_lingualization;
    // getter
    if (arguments.length == 0) {
      if (!multi) {
        return this._input.val();
      } else {
        return !this._draft ? {} : this._draft;
      }
    }
    // setter
    if (!multi) {
      this._value = Utils.is_object(value) ? value[""] : value;
    } else {
      this._value = Utils.is_object(value) ? value : { "" : value };
    }
    this._draft = this._value;
    this._input.val(!multi ? this._value : Locale.translate(this._value));
  };
  
  Text.prototype.refresh = function() {
    var multi = this._properties.multi_lingualization;
    if (!multi) {
      return;
    }
    this._input.val(Locale.translate(this._draft));
  };
  
  Text.generate_renderer = function(default_properties, field) {
    var props = Utils.get_as_json(default_properties, function() { return field.datatype.properties; });

    var dfd = new $.Deferred;
    var renderer = function(record, index, column_index) {
      var value = record[field.name];
      if (Utils.is_object(value) && props.multi_lingualization) {
        return Locale.translate(value);
      } else {
        return value;
      }
    };
    dfd.resolve(renderer);
    return dfd.promise();
  };

  Text.cell_render = function(field) {
    return Text.generate_renderer(Text.DEFAULT_PROPERTIES, field);
  };

  return Text;
});
