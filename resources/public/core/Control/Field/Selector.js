define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Storage = require("core/Storage");
  var Inherits = require("core/Inherits");
  var Dialog = require("core/Dialog");
  var Class = require("core/Class");
  var Grid = require("core/Control/Grid");
  var Field = require("core/Control/Field/Field");
  
  var TEMPLATE = '' +
'<label></label>' +
'<div>' +
'  <i name="search" class="fa fa-search" /><span name="description"></span>' +
'  <div name="list"></div>' +
'</div>';

  var ITEM_TEMPLATE = '' +
'<div class="item" style="margin:2px 0px;">' +
'  <span style="display:inline-block;border:solid 1px gray;border-radius:3px;background-color:#f0f0f0;padding:2px 5px 2px 5px;font-family:Verdana,Arial,sans-serif;font-size:12px;min-width:300px;"></span>' +
'  <i class="fa fa-remove" />' +
'</div>';

  function create_search(self, root, field) {
    self._search.on("click", function(event) {
      var dialog = new Dialog();
      var grid = new Grid();
      var select_panel = "";
      dialog.init(function(panel_id) {
        var dfd = new $.Deferred;
        
        var selector = "#" + panel_id;
        var panel = $(selector);
        panel.addClass("selector");

        grid.init(selector, self._columns)
        .then(function() {
          grid.multi_search(true);
          grid.multi_select(field.datatype.properties.multi_selectable);
          grid.select_column(true);
          grid.toolbar(true);
          var data = Object.keys(self._objects).map(function(id) { return self._objects[id]; });
          grid.data(data);
          grid.refresh();
          dfd.resolve();
        });
        return dfd.promise();
      });
      dialog.title("Select");
      dialog.buttons([
        {
          text : "OK",
          click: function (event) {
            var recids = grid.selection();
            console.log("[OK] clicked. selection=" + recids);
            self._value = recids;
            self.refresh();
            dialog.close();
          }
        },
        {
          text : "Cancel",
          click: function (event) {
            console.log("[Cancel] clicked.");
            dialog.close();
          }
        }
      ]);
      dialog.size(300, 400);
      
      dialog.open();
    });
  }
  
  function Selector() {
    Field.call(this, "core/Control/Field", "Selector");
    this._search = null;
    this._description = null;
    this._list = null;
    this._class = null;
    this._columns = null;
    this._objects = null;
    this._fixed = null;
    this._value = null;
    this._editting = false;
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
    label.text(field.label);
    // Seach Icon
    this._search = root.find("div > i[name='search']");
    // Description
    this._description = root.find("div > span[name='description']");
    this._description.text(field.datatype.properties.description);
    // List
    this._list = root.find("div > div[name='list']");
    this._list.on("click", "div.item > i", function(event) {
      var i = $(event.originalEvent.target);
      var record = i.parent();
      record.remove();
      var id = record.attr("id");
      self._value = self._value.filter(function (_id) { return _id != id; });
    });
    // Mouse over/out on icons.
    root.on("mouseover", "i", function(event) {
      var i = $(event.originalEvent.target);
      i.css("cursor", "pointer");
    });
    root.on("mouseout", "i", function(event) {
      var i = $(event.originalEvent.target);
      i.css("cursor", "auto");
    });
    
    var self = this;
    var class_id = field.datatype.properties.class_id;
    console.assert(!(!class_id), field);
    $.when(
      Utils.load_css("/core/Control/Field/Selector.css"),
      Storage.read(Class.CLASS_ID, class_id)
      .done(function(data) {
        self._class = data;
        return Grid.create_columns(self._class)
          .done(function (columns_) { self._columns = columns_; });
      }),
      Storage.read(class_id).done(function(data) { self._objects = data; })
    ).then(function() {
      create_search(self, root, field);
      self.edit(false);
      dfd.resolve();
    });
    return dfd.promise();
  };
  
  Selector.prototype.edit = function(on) {
    this._editting = on;
    if (on) {
      this._search.show();
      this._list.find("div.item > i").css("display", "inline");
    } else {
      this._search.hide();
      this._list.find("div.item > i").css("display", "none")
    }
  };

  Selector.prototype.backuped = function() {
    return this._fixed;
  };

  Selector.prototype.commit = function() {
    this._fixed = this._value;
  };

  Selector.prototype.restore = function() {
    this._value = this._fixed;
    this.refresh();
  };

  Selector.prototype.data = function(value) {
    if (arguments.length == 0) {
      return this._value;
    }
    
    this._value = Array.isArray(value) ? value : [value];
    this._fixed = this._value;
    this.refresh();
  };
  
  Selector.prototype.update = function(keys) {
  
  };
  
  Selector.prototype.refresh = function() {
    console.log("Selector.refresh called.");
    this._list.empty();
    
    if (!this._value) {
      this._value = [];
    }
    var self = this;
    var objects = this._value.map(function(id) { return self._objects[id]; });
    var captions = (new Class(this._class)).captions(objects);
    for (var i = 0; i < captions.length; i++) {
      var file = this._value[i];
      this._list.append(ITEM_TEMPLATE);
      var record = this._list.find("div.item:last-child");
      record.attr("id", this._value[i]);
      record.find("span").text(captions[i]);
    }
    this.edit(this._editting);
  };

  Selector.cell_render = function(field) {
    var dfd = new $.Deferred;
    var class_id = field.datatype.properties.class_id;
    var class_ = null;
    var objects = null;
    $.when(
      Storage.read(Class.CLASS_ID, class_id, true).done(function(data) { class_ = data; }),
      Storage.read(class_id, null, true).done(function(data) { objects = data; })
    ).always(function() {
      var renderer = function(record, index, column_index) {
        var ids = record[field.name];
        var targets = ids.map(function(id) { return objects[id]; });
        var captions = (new Class(class_)).captions(targets);
        return captions.join(",");
      };
      console.log("Selector.cell_render, class_id = " + field.datatype.properties.class_id);
      dfd.resolve(renderer);
    });
    return dfd.promise();
  };
  
  return Selector;
}); 
