define(function (require) { 
  require("jquery");
  var Utils = require("data/Core/Utils");
  var Inherits = require("data/Core/Inherits");
  var Field = require("data/Control/Field/Field");
  
  var TEMPLATE = '' +
'<div class="editor">' +
'  <select name="{{:name}}" multiple size="10">' +
'  {{for items}}' +
'    <option value="{{:value}}">{{:caption}}</option>' +
'  {{/for}}' +
'  </select>' +
'</div>' +
'<div class="viewer">' +
'</div>';
  
  function List() {
    Field.call(this, "data/Control/Field", "List");
    this._class = null;
  	this._editor = null;
  	this._viewer = null;
    this._items = null;
    this._values = null;
  }
  Inherits(List, Field);

  function get_selected_values(self) {
    var values = [];
    var options = self._editor.find("option");
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
    var template = $.templates(TEMPLATE);
    var class_id = field.datatype["class"];
    var self = this;
    $.when(
      Utils.get_data(Utils.CLASS_ID, class_id, function(response) { self._class = response; }),
      Utils.get_data(class_id, null, function(response) { self._items = response; })
    ).always(function() {
      var key_field_name = self._class.object_fields.filter(function(field) { return !(!field.key); }).map(function(field) { return field.name; })[0];
      var caption_field_names = self._class.object_fields.filter(function(field) { return !(!field.caption); }).map(function(field) { return field.name; });
      var items = self._items.map(function(item) { return { "value" : item[key_field_name], "caption" : item[caption_field_names[0]] }; });
      var html = template.render({ "name" : field.name, "items" : items });
      root.append(html);
      self._editor = root.find("div.editor");
      self._viewer = root.find("div.viewer");
      dfd.resolve();
    });
    return dfd.promise();
  };

  List.prototype.edit = function(on) {
    if (on) {
      this._editor.show();
      this._viewer.hide();
    } else {
      this._editor.hide();
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
    var options = this._editor.find("option");
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
