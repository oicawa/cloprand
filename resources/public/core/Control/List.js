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
  var Field = require("core/Control/Field/Field");
  var Dialog = require("core/Dialog");
  var Action = require("core/Action");
  var app = require("app");
  
  var TEMPLATE = '' +
'<div>' +
'  <div class="records"></div>' +
'</div>';
  
  function List() {
    this._class = null;
    this._toolbar = null;
    this._grid = null;
    this._detail = null;
    this._dialog = null;
    this._data = null;
    this._backuped = null;
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
            console.log("[OK] clicked");
            ok_func(detail);
            dialog.close();
            return false;
          }
        },
        {
          text : "Cancel",
          click: function (event) {
            console.log("[Cancel] clicked");
            dialog.close();
            return false;
          }
        }
      ]);
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
  	var self = event.item.context;
  	if (!self) {
  	  return;
  	}
    var recids = self._grid.selection();
    if (recids.length != 1) {
      Dialog.show("Select one item.");
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
  	var self = event.item.context;
  	if (!self) {
  	  return;
  	}
    var recids = self._grid.selection();
    if (recids.length == 0) {
      Dialog.show("Select one or more items.");
      return;
    }
    Dialog.confirm("Delete?", function(answer) {
      if (answer == "No")
        return;
      self._grid.remove(recids);
      self._grid.refresh(reorder);
    });
  };
  
  List.up = function (event) {
  	var self = event.item.context;
  	if (!self) {
  	  return;
  	}
    var message = "Select one item. (without 1st)";
    var recids = self._grid.selection();
    if (recids.length != 1) {
      Dialog.show(message);
      return;
    }
    var recid = recids[0];
    var index = self._grid.get(recid, true);
    if (index == 0) {
      Dialog.show(message);
      return;
    }
    self._grid.unselect();
    self._grid.move(recid, -1);
    self._grid.select(recid);
    self._grid.refresh(reorder);
  };
  
  List.down = function (event) {
  	var self = event.item.context;
  	if (!self) {
  	  return;
  	}
    var message = "Select one item. (without last)";
    var recids = self._grid.selection();
    if (recids.length == 0) {
      Dialog.show(message);
      return;
    }
    var recid = recids[0];
    var index = self._grid.get(recid, true);
    if (index == self._grid.data().length - 1) {
      Dialog.show(message);
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
      console.log(event);
    });
    return html;
  }

  List.prototype.init = function(selector, options) {
    var dfd = new $.Deferred;
    var root = $(selector);
    if (0 < root.children()) {
      dfd.resolve();
      return dfd.promise();
    }

    var columns = null;
    var self = this;
    self._grid = new Grid();
    var styles = {
      'width' : options.width,
      'height': options.height
    };

    Storage.read(Class.CLASS_ID, options.class_id).done(function (data) { self._class = data; })
    .then(function() {
      return Grid.create_columns(self._class).done(function(columns_) { columns = columns_; });
    })
    .then(function() {
      root.append(TEMPLATE);
    })
    .then(function() {
      return self._grid.init(selector + " > div > div.records", columns, styles);
    })
    .then(function() {
      return Action.convert(options.actions, self).done(function(actions) { self._grid.actions(actions); });
    })
    .then(function() {
      self._grid.toolbar(false);
      self._grid.multi_search(false);
      //self._grid.actions([
      //  { id:"add",    type:"button", text:"Add",    icon:"w2ui-icon-plus",   onClick: List.add,    context: self },
      //  { id:"edit",   type:"button", text:"Edit",   icon:"fa fa-pencil",     onClick: List.edit,   context: self },
      //  { id:"remove", type:"button", text:"Remove", icon:"w2ui-icon-cross",  onClick: List.remove, context: self },
      //  { id:"up",     type:"button", text:"Up",     icon:"fa fa-arrow-up",   onClick: List.up,     context: self },
      //  { id:"down",   type:"button", text:"Down",   icon:"fa fa-arrow-down", onClick: List.down,   context: self }
      //  //{ id:"search", type:"html",   text:"Search", icon:"fa fa-search",     html:search_generator }
      //]);
      self._grid.refresh();
      dfd.resolve();
    });
    return dfd.promise();
  };

  List.prototype.backuped = function() {
    return this._backuped;
  };

  List.prototype.commit = function() {
    this._backuped = this._grid.data();
  };

  List.prototype.restore = function() {
    this._grid.data(this._backuped);
  };

  List.prototype.edit = function(on) {
    this._grid.toolbar(on);
  };

  List.prototype.data = function(values) {
    if (arguments.length == 0) {
      return this._grid.data();
    } else {
      var values_ = !values ? [] : values.map(function(value, index) {
        delete value["recid"];
        value.id = index + 1;
        return value;
      });
      this._grid.data(values_);
      this._backuped = values_;
    }
  };
  
  List.prototype.refresh = function(on) {
    this._grid.refresh();
  };

  return List;
}); 
