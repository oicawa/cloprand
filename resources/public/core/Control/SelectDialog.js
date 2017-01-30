define(function (require) { 
  require("jquery");
  var Utils = require("core/Utils");
  var Dialog = require("core/Dialog");
  var Class = require("core/Class");
  var Grid = require("core/Control/Grid");
  var Field = require("core/Control/Field/Field");
  
  function create_search(self, root, field) {
    self._search.on("click", function(event) {
    });
  }
  
  function SelectDialog() {
    this._dialog = null;
    this._ok = null;
    this._grid = null;
    this._items = null;
  }

  SelectDialog.prototype.init = function(columns, items, multi_selectable) {
    var dfd = new $.Deferred;
    
    console.assert(Array.isArray(items), "'items' not Array");
    
    this._items = items;
    this._dialog = new Dialog();
    this._grid = new Grid();
    
    var self = this;
    var selector = null;
    
    Utils.load_css("/core/Control/SelectDialog.css")
    .then(function() {
      return self._dialog.init(function(panel_id) {
        var inner_dfd = new $.Deferred;
        selector = "#" + panel_id;
        var panel = $(selector);
        panel.addClass("selectdialog");

        function ok_handler(event) {
          var recids = self._grid.selection();
          if (typeof self._ok == "function")
            self._ok(recids);
          self._dialog.close();
        }

        self._dialog.buttons([
          { text: "OK",    click:ok_handler},
          { text:"Cancel", click:function (event) { self._dialog.close(); }}
        ]);
        inner_dfd.resolve();
        return inner_dfd.promise();
      });
    })
    .then(function() {
      return self._grid.init(selector, columns);
    })
    .then(function() {
      self._grid.multi_search(true);
      self._grid.multi_select(multi_selectable);
      self._grid.select_column(true);
      self._grid.toolbar(true);
      self._grid.data(items);
      self._grid.refresh();
      dfd.resolve();
    });
    return dfd.promise();
  };

  SelectDialog.prototype.title = function(title_) {
    this._dialog.title(title_);
  };
  
  SelectDialog.prototype.ok = function(callback) {
    this._ok = callback;
  };
  
  SelectDialog.prototype.size = function(width, height) {
    this._dialog.size(width, height);
  };

  SelectDialog.prototype.open = function() {
    this._dialog.open();
  };

  SelectDialog.prototype.close = function() {
    this._dialog.close();
  };

  
  return SelectDialog;
}); 
