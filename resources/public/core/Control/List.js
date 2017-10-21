define(function (require) { 
  require("jquery");
  require("w2ui");
  var Utils = require("core/Utils");
  var Locale = require("core/Locale");
  var Uuid = require("core/Uuid");
  var Class = require("core/Class");
  var Storage = require("core/Storage");
  var Dialog = require("core/Dialog");
  var Inherits = require("core/Inherits");
  var Grid = require("core/Control/Grid");
  var Detail = require("core/Control/Detail");
  var Toolbar = require("core/Control/Toolbar");
  var Menu = require("core/Control/Menu");
  var Field = require("core/Control/Field/Field");
  var Dialog = require("core/Dialog");
  var SelectDialog = require("core/Control/SelectDialog");
  var app = require("app");
  
  var TEMPLATE = '' +
'<div>' +
'  <div class="records"></div>' +
'</div>';
  
  function edit_toolbar(toolbar, on) {
    var WRITING = ["add", "import", "edit", "remove", "move", "up", "down", "search"]; 
    var READING = ["display"]; 
    toolbar.show.apply(toolbar, on ? WRITING : READING);
    toolbar.hide.apply(toolbar, on ? READING : WRITING);
  };
  
  function List() {
    this._class = null;
    this._objects = null;
    this._columns = null;
    this._toolbar = null;
    this._options = false;
    this._grid = null;
    this._detail = null;
    this._dialog = null;
    this._data = null;
    this._backup = null;
  };
  
  List.prototype.showDetailDialog = function (self, title, fields, data, ok_func) {
    var detail = new Detail();
    var dialog = new Dialog();
    dialog.init(function(id) {
  	  var dfd = new $.Deferred;
  	  detail.init('#' + id, fields)
  	  .then(function () {
  	    detail.data(data);
  	    detail.edit(true);
  	    detail.refresh();
  	    detail.visible(true);
  	    dfd.resolve();
  	  });
      return dfd.promise();
    }).then(function () {
      dialog.title(title);
      dialog.buttons([
        {
          text : "OK",
          click: function (event) {
            //console.log("[OK] clicked");
            ok_func(detail);
            dialog.close();
            return false;
          }
        },
        {
          text : "Cancel",
          click: function (event) {
            //console.log("[Cancel] clicked");
            dialog.close();
            return false;
          }
        }
      ]);
      dialog.open();
    });
  };

  List.prototype.showImportDialog = function (title) {
    var items = null;
    var self = this;
    var width = self._grid._columns.map(function(column) { return parseInt(column.size); }).reduce(function (prev, current, index, array) { return prev + current; }, 100);
    var dialog = new SelectDialog();

    Storage.read(this._class.id).done(function (data) { items = data; })
    .then(function () {
      var objects = Object.keys(items).map(function(id) { return items[id]; });
      return dialog.init({columns:self._grid._columns, comparers:self._grid._comparers, items:objects, multi_selectable:true, field_map:self._grid._field_map});
    })
    .done(function() {
      dialog.title(title);
      dialog.ok(function (recids) {
        //console.log("[OK] clicked. selection=" + recids);
        for (var i = 0; i < recids.length; i++) {
          var recid = recids[i];
          var item = items[recid];
          var index = self._grid.data().length + i + 1;
          var cloned = Utils.clone(item);
          cloned["recid"] = index;
          cloned["id"] = index;
          self._grid.add(cloned);
        }
        self.refresh();
      });
      dialog.size(width, 400);
      dialog.open();
    });
  };

  List.prototype.showSelectDialog = function (title) {
    var items = null;
    var self = this;
    var width = self._grid._columns.map(function(column) { return parseInt(column.size); }).reduce(function (prev, current, index, array) { return prev + current; }, 100);
    var dialog = new SelectDialog();

    Storage.read(this._class.id).done(function (data) { items = data; })
    .then(function () {
      var objects = Object.keys(items).map(function(id) { return items[id]; });
      return dialog.init({columns:self._grid._columns, comparers:self._grid._comparers, items:objects, multi_selectable:true, field_map:self._grid._field_map});
    })
    .done(function() {
      dialog.title(title);
      dialog.ok(function (recids) {
        //console.log("[OK] clicked. selection=" + recids);
        for (var i = 0; i < recids.length; i++) {
          var recid = recids[i];
          var item = items[recid];
          var index = self._grid.data().length + i + 1;
          var cloned = Utils.clone(item);
          if (self._options.embedded) {
            cloned["recid"] = index;
            cloned["id"] = index;
          }
          self._grid.add(cloned);
        }
        self.refresh();
      });
      dialog.size(width, 400);
      dialog.open();
    });
  };

  List.add = function (event) {
  	var self = event.item.context;
  	if (!self) {
  	  return;
  	}
    self.showDetailDialog(self, Locale.translate(self._class.label), self._class.object_fields, null, function (detail) {
      var data = detail.data();
      data.id = self._grid.data().length + 1;
      self._grid.add(data);
      self._grid.refresh();
    });
  };
  
  List.edit = function (event) {
  	var item = event.item;
  	var self = item.context;
  	if (!self) {
  	  return;
  	}
    var recids = self._grid.selection();
    if (recids.length != 1) {
      var entry_props = !item.function_entry ? null : item.function_entry.properties;
      var message = !entry_props ? "Select one item." : Locale.translate(entry_props.select_message);
      Dialog.show(message, item.text);
      return;
    }
    var recid = recids[0];
    var data = self._grid.get(recid);
    self.showDetailDialog(self, Locale.translate(self._class.label), self._class.object_fields, data, function (detail) {
      var data = detail.data();
      data.id = recid;
      self._grid.set(recid, data);
      self._grid.refresh();
    });
  };
  
  function reorder(item, index) {
    delete item["recid"];
    item.id = index + 1;
  }
  
  List.remove = function (event) {
  	var item = event.item;
  	var self = item.context;
  	if (!self) {
  	  return;
  	}

    var entry_props = !item.function_entry ? null : item.function_entry.properties;
    var recids = self._grid.selection();
    if (recids.length == 0) {
      var message = !entry_props ? "Select one or more items." : Locale.translate(entry_props.select_message);
      Dialog.show(message, item.text);
      return;
    }
    var message = !entry_props ? "Do you want to remove." : Locale.translate(entry_props.confirm_message);
    Dialog.confirm(message, item.text)
    .yes(function(answer) {
      self._grid.remove(recids);
      self._grid.refresh(reorder);
    });
  };
  
  List.up = function (event) {
  	var item = event.item;
  	var self = item.context;
  	if (!self) {
  	  return;
  	}
    var entry_props = !item.function_entry ? null : item.function_entry.properties;
    var recids = self._grid.selection();
    if (recids.length != 1) {
      var message = !entry_props ? "Select one item without top." : Locale.translate(entry_props.select_message);
      Dialog.show(message, item.text);
      return;
    }
    var recid = recids[0];
    var index = self._grid.get(recid, true);
    if (index == 0) {
      var message = !entry_props ? "Selected item is top." : Locale.translate(entry_props.top_message);
      Dialog.show(message, item.text);
      return;
    }
    self._grid.unselect();
    self._grid.move(recid, -1);
    self._grid.select(recid);
    self._grid.refresh(reorder);
  };
  
  List.down = function (event) {
  	var item = event.item;
  	var self = item.context;
  	if (!self) {
  	  return;
  	}
    var entry_props = !item.function_entry ? null : item.function_entry.properties;
    var recids = self._grid.selection();
    if (recids.length == 0) {
      var message = !entry_props ? "Select one item without bottom." : Locale.translate(entry_props.select_message);
      Dialog.show(message, item.text);
      return;
    }
    var recid = recids[0];
    var index = self._grid.get(recid, true);
    if (index == self._grid.data().length - 1) {
      var message = !entry_props ? "Selected item is bottom." : Locale.translate(entry_props.bottom_message);
      Dialog.show(message, item.text);
      return;
    }
    self._grid.unselect();
    self._grid.move(recid, 1);
    self._grid.select(recid);
    self._grid.refresh(reorder);
  };

  function search_generator(item) {
    var template = "<div id={{ID}} style='margin:0px 5px 0px 5px;'><i class='{{ICON}}'style='margin:2px;'/><input type='text' class='w2ui-grid w2ui-toolbar-search'/></div>";
    var id = Uuid.version4();
    var html = template.replace(/{{ID}}/, id)
                       .replace(/{{ICON}}/, item.icon);
    var selector = "#" + item.inner_id + " > input";
    $(document).off("keyup", selector);
    $(document).on("keyup", selector, function (event) {
      //console.log(event);
    });
    return html;
  }
  
  List.import = function (event) {
    var self = event.item.context;
    if (!self) {
      return;
    }
    self.showImportDialog(Locale.translate(self._class.label));
  };
  
  List.search = function (event) {
    var self = event.item.context;
    if (!self) {
      return;
    }
    self.showSelectDialog(Locale.translate(self._class.label));
  };
  
  List.display = function (event) {
    var item = event.item;
    var self = item.context;
    if (!self) {
      return;
    }
    var recids = self._grid.selection();
    if (recids.length != 1) {
      var entry_props = !item.function_entry ? null : item.function_entry.properties;
      var message = !entry_props ? "Select one item." : Locale.translate(entry_props.select_message);
      Dialog.show(message, item.text);
      return;
    }
    var recid = recids[0];
    var data = self._grid.get(recid);
    self.showDetailDialog(self, Locale.translate(self._class.label), self._class.object_fields, data, function (detail) {
      var data = detail.data();
      data.id = recid;
      self._grid.set(recid, data);
      self._grid.refresh();
    });
  };

  List.prototype.init = function(selector, options) {
    var dfd = new $.Deferred;
    var root = $(selector);
    if (0 < root.children()) {
      dfd.resolve();
      return dfd.promise();
    }
    
    this._options = options;
    if (!this._options.toolbar_items) {
      this._options.toolbar_items = [];
    }
    
    var columns = null;
    var self = this;
    self._grid = new Grid();
    var styles = {
      'width' : options.width,
      'height': options.height
    };
    var options_ = {"styles":styles};

    Storage.read(Class.CLASS_ID, options.class_id).done(function (data) { self._class = data; })
    .then(function() {
      return Class.field_map(self._class).done(function(field_map) { options_.field_map = field_map; });
    })
    .then(function() {
      options_.columns = Grid.columns(self._class, options_.field_map);
    })
    .then(function() {
      root.append(TEMPLATE);
    })
    .then(function() {
      return self._grid.init(selector + " > div > div.records", options_);
    })
    .then(function() {
      if (!self._options.embedded) {
        return Storage.read(options.class_id).done(function (data) { self._objects = data; })
      }
    })
    .then(function() {
      var src_items = !self._options.embedded ? options.toolbar_items.map(function (id) { return self._objects[id]; }) : options.toolbar_items;
      console.log(src_items);
      return Menu.convert(src_items, self).done(function(dst_items) { console.log(dst_items); self._grid.items(dst_items); });
    })
    .then(function() {
      self._grid.toolbar(true);
      self._grid.numbers(true);
      self._grid.multi_search(false);
      self._grid.refresh();
      dfd.resolve();
    });
    return dfd.promise();
  };

  List.prototype.backup = function() {
    return Utils.clone(this._backup);
  };

  List.prototype.commit = function() {
    this._backup = Utils.clone(this._grid.data());
  };

  List.prototype.restore = function() {
    this._grid.data(Utils.clone(this._backup));
  };

  List.prototype.edit = function(on) {
    this._grid.draggable(on);
    edit_toolbar(this._grid._grid.toolbar, on);
  };

  List.prototype.data = function(values) {
    // getter
    if (arguments.length == 0) {
      var data = this._options.embedded ? this._grid.data() : this._grid.data().map(function (item) { return item.id; });
      return Utils.clone(data);
    }
    
    // setter
    var self = this;
    var items = !values ? [] : values.map(function(value, index) {
      if (Utils.is_object(value)) {
        delete value["recid"];
        value.id = index;
      }
      var item = self._options.embedded ? value : self._objects[value];
      return item;
    });
    this._grid.data(Utils.clone(items));
    this._backup = Utils.clone(items);
  };
  
  List.prototype.refresh = function(on) {
    this._grid.refresh();
  };

  List.prototype.items = function(items) {
    this._grid.items(items);
  };

  return List;
}); 
