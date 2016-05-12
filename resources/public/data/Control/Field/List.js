define(function (require) { 
  require("jquery");
  var Utils = require("data/Core/Utils");
  var Connector = require("data/Core/Connector");
  var Inherits = require("data/Core/Inherits");
  var Field = require("data/Control/Field/Field");
  
  var TEMPLATE = '' +
'<label></label>' +
'<div>' +
'  <select multiple size="8" style="color:black;"></select>' +
'  <div class="viewer"></div>' +
'</div>';

  var OPTION_TEMPLATE = '<option style="color:black;"></option>';
  
  function List() {
    Field.call(this, "data/Control/Field", "List");
    this._class = null;
    this._list = null;
    this._viewer = null;
    this._items = null;
    this._values = null;
  }
  Inherits(List, Field);

  function get_selected_values(self) {
    var values = [];
    var options = self._list.find("option");
    for (var i = 0; i < options.length; i++) {
      var option = options[i];
      if (!option.selected) {
        continue;
      }
      values.push(option.value);
    }
    return values;
  }

  List.prototype.init = function(selector, field) {
    var dfd = new $.Deferred;
    var root = $(selector);
    var class_id = field.datatype["class"];
    var self = this;
    $.when(
      Connector.crud.read("api/" + Utils.CLASS_ID + "/" + class_id, "json", function(response) { self._class = response; }),
      Connector.crud.read("api/" + class_id, "json", function(response) { self._items = response; })
    ).always(function() {
      var key_field_name = self._class.object_fields.filter(function(field) { return !(!field.key); }).map(function(field) { return field.name; })[0];
      var caption_field_names = self._class.object_fields.filter(function(field) { return !(!field.caption); }).map(function(field) { return field.name; });
      var items = self._items.map(function(item) { return { "value" : item[key_field_name], "caption" : item[caption_field_names[0]] }; });
      root.append(TEMPLATE);
      var label = root.find("label");
      label.text(field.label);
      self._list = root.find("select");
      self._list.attr("name", field.name);
      for (var i = 0; i < items.length; i++) {
        self._list.append(OPTION_TEMPLATE);
        var option = self._list.find("option:last-child");
        option.attr("value", items[i].value);
        option.text(items[i].caption);
      }
      self._viewer = root.find("div.viewer");
      dfd.resolve();
    });
    return dfd.promise();
  };

  List.prototype.edit = function(on) {
    if (on) {
      this._list.show();
      this._viewer.hide();
    } else {
      this._list.hide();
      this._viewer.show();
    }
  };

  List.prototype.backuped = function() {
    return this._values;
  };

  List.prototype.commit = function() {
    this._values = get_selected_values(this);
  };

  List.prototype.refresh = function() {
    // editor
    // convert values (Array -> Hash)
    var flags = {};
    if (!(!this._values)) {
      for (var i = 0; i < this._values.length; i++) {
        flags[this._values[i]] = true;
      }
    }
    
    // change selected attribute
    var options = this._list.find("option");
    for (var i = 0; i < options.length; i++) {
      var option = options[i];
      var value = option.value;
      var flag = flags[value];
      option.selected = !flag ? false : true;
    }
      
    // viewer
    // convert items (Array -> Hash)
    var items_dictionary = {};
    for (var i = 0; i < this._items.length; i++) {
      var item = this._items[i];
      items_dictionary[item.id] = item;
    }
    // refresh viewer tags
    this._viewer.empty();
    if (!(!this._values)) {
      for (var i = 0; i < this._values.length; i++) {
        var value = this._values[i];
        var item = items_dictionary[value];
        if (!item) {
          continue;
        }
        var caption = Utils.get_caption(this._class, item);
        this._viewer.append("<div>" + caption + "</div>");
      }
    }
  };

  List.prototype.restore = function() {
    this.refresh();
  };

  List.prototype.data = function(values) {
    if (arguments.length == 0) {
      return get_selected_values(this);
    } else {
      this._values = values;
    }
    this.refresh();
  };

  return List;
}); 
