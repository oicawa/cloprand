define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Storage = require("core/Storage");
  var Inherits = require("core/Inherits");
  var SelectDialog = require("core/Control/SelectDialog");
  var Class = require("core/Class");
  var Grid = require("core/Control/Grid");
  var DivButton = require("core/Control/DivButton");
  var Uuid = require("core/Uuid");
  
  var TEMPLATE = '' +
'<div class="finder">' +
'  <div name="button" style="vertical-align:top;"></div>' +
'  <div name="list" style="display:inline-block;"></div>' +
'</div>';

  var ITEM_TEMPLATE = '' +
'<div class="item" style="border:solid 1px gray;border-radius:3px;background-color:#f0f0f0;padding:2px 5px 2px 5px;margin:2px 0px;">' +
'  <span style="display:inline-block;font-size:12px;"></span>' +
'  <i class="fa fa-remove" />' +
'</div>';

  function create_search(selector, self) {
    function search(event) {
      var items = Object.keys(self._objects).map(function(id) { return self._objects[id]; });
      var width = self._columns.map(function(column) { return parseInt(column.size); }).reduce(function (prev, current, index, array) { return prev + current; }, 100);
      var dialog = new SelectDialog();
      console.log(self._columns);
      dialog.init({ items : items, columns : self._columns, multi_selectable : self._multi_selectable, field_map : self._field_map })
      .done(function() {
        dialog.title("Select");
        dialog.ok(function (recids) {
          self._value = recids;
          if (typeof self._ok == "function")
            self._ok(recids);
          self.refresh();
        });
        dialog.size(width, 500);
        dialog.open();
      });
    }
    self._search = new DivButton();
    return self._search.init(selector, '<i class="fa fa-search" />', search);
  }
  
  function Finder() {
    this._search = null;
    this._list = null;
    this._class = null;
    this._columns = null;
    this._objects = null;
    this._fixed = null;
    this._value = null;
    this._editting = false;
    this._ok = null;
    this._converter = null;
    this._multi_selectable = null;
    this._min_width = null;
  }

  Finder.prototype.init = function(selector, columns, field_map, items, description, multi_selectable, min_width, converter, font_name) {
    var dfd = new $.Deferred;
    
    this._columns = columns;
    this._field_map = field_map;
    this._objects = items;
    this._converter = converter;
    this._multi_selectable = multi_selectable;
    this._min_width = min_width;
    
    // Set member fields
    var root = $(selector);
    if (0 < root.children()) {
      dfd.resolve();
      return dfd.promise();
    }
    
    // Create form tags
    var html = TEMPLATE.replace(/{{FONT_NAME}}/, !font_name ? "fa-search" : font_name);
    root.empty();
    root.append(html);
    // Seach Icon
    this._search = root.find("div > i[name='search']");
    // List
    this._list = root.find("div > div[name='list']");
    this._list.attr("id", Uuid.version4());
    this._list.on("click", "div.item > i", function(event) {
      var i = $(event.originalEvent.target);
      var record = i.parent();
      record.remove();
      var id = record.attr("id");
      if (self._multi_selectable) {
        self._value = self._value.filter(function (_id) { return _id != id; });
      } else {
        self._value = null;
      }
      self.refresh();
    });
    this._list.droppable({
      accept : "div.item",
      drop : function(event , ui){
        console.log("Dropped");
        console.log(event);
        console.log(ui);
      }
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
    Utils.load_css("/core/Control/Finder.css")
    .then(function() {
      return create_search(selector + " > div > div[name='button']", self);
    })
    .then(function() {
      self.edit(false);
      dfd.resolve();
    });
    return dfd.promise();
  };

  Finder.prototype.ok = function(callback) {
    this._ok = callback;
  };
  
  Finder.prototype.edit = function(on) {
    if (arguments.length == 0) {
      return this._editting;
    }
    this._editting = on;
    this._search.visible(on);
    this._list.find("div.item > i").css("display", on ? "inline" : "none");
  };

  Finder.prototype.backup = function() {
    return this._fixed;
  };

  Finder.prototype.commit = function() {
    this._fixed = this._value;
  };

  Finder.prototype.restore = function() {
    this._value = this._fixed;
    this.refresh();
  };

  function getter(self, value) {
    var multi = self._multi_selectable;
    
    // null or undefined
    if (!value) {
      return multi ? [] : null;
    }
    
    // *NOT* Array
    if (!Array.isArray(value)) {
      return multi ? [value] : value;
    }
    
    // Array
    if (multi) {
      return value;
    }
    if (value.length == 0) {
      return null;
    }
    return value[0];
  }
  
  function setter(self, value) {
    self._value = getter(self, value);
    self._fixed = self._value;
  }

  Finder.prototype.data = function(value) {
    if (arguments.length == 0) {
      return getter(this, this._value);
    }
    setter(this, value);
  };
  
  Finder.prototype.update = function(keys) {
  };
  
  Finder.prototype.clear = function() {
    this._value = [];
    this.refresh();
  };
  
  Finder.prototype.refresh = function() {
    this._list.empty();
    
    var value = getter(this, this._value);
    value = this._multi_selectable ? value : [value];
    
    var self = this;
    var objects = value.map(function(id) { return self._objects[id]; });
    var captions = this._converter(objects);
    for (var i = 0; i < captions.length; i++) {
      var file = value[i];
      this._list.append(ITEM_TEMPLATE);
      var record = this._list.find("div.item:last-child");
      record.attr("id", value[i]);
      var span = record.find("span");
      span.text(captions[i]);
      span.css("min-width", !this._min_width ? "200px" : this._min_width);
    }
    var id = this._list.attr("id");
    //this._list.children("div.item").draggable({ axis: "y", containment: "#" + id, snap: "#" + id });
    this._list.children("div.item").draggable({ axis: "y", containment: "#" + id });
    this.edit(this._editting);
  };

  Finder.prototype.multi_selectable = function () {
    return this._multi_selectable;
  };

  Finder.renderer = function(field) {
    var dfd = new $.Deferred;
    var class_id = field.datatype.properties.class_id;
    var class_ = null;
    var objects = null;
    $.when(
      Storage.read(Class.CLASS_ID, class_id).done(function(data) { class_ = data; }),
      Storage.read(class_id).done(function(data) { objects = data; })
    ).always(function() {
      var renderer = function(record, index, column_index) {
        var value = record[field.name];
        if (!value) {
          return "";
        }
        var ids = Array.isArray(value) ? value : [value];
        var targets = ids.map(function(id) { return objects[id]; });
        var captions = (new Class(class_)).captions(targets);
        return captions.join(",");
      };
      dfd.resolve(renderer);
    });
    return dfd.promise();
  };
  
  return Finder;
});
