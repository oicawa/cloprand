define(function (require) {
  require("jquery");
  var app = require("app");
  var Utils = require("core/Utils");
  var Class = require("core/Class");
  var Connector = require("core/Connector");
  var Grid = require("core/Control/Grid");
  
  var TEMPLATE = '' +
'<div class="menuview-panel">' +
'  <div class="menu-list">' +
'  </div>' +
'</div>';

  function MenuView() {
    this._selector = null;
    this._class_id = null;
    this._object_id = null;
    this._grid = null;
  }
  
  MenuView.show_gridview = function (event) {
    // Get event source information
    var tab = $(event.originalEvent.target).closest("div.tab-panel");
    var index = event.recid - 1;
    var tab_id = tab.prop("id");

    // Get clicked data (from 'tab_id'->'view'->'grid'->'data'-> item of the selected index row.)
    var view = app.contents().content(tab_id);
    var grid = view.list();
    var data = grid.get(event.recid);
    app.contents().show_tab(data.label, null, "ListView", data.id, null);
  };
  
  MenuView.prototype.list = function () {
    return this._grid;
  };
  
  MenuView.prototype.update = function (keys) {
    var target = false;
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key.class_id == Class.CLASS_ID) {
        target = true;
        break;
      }
    }

    if (!target) {
      return;
    }

    var classes = null;
    var self = this;
    Connector.crud.read("api/" + Class.CLASS_ID, "json", function (data) { classes = data; })
    .then(function () {
      var menus = classes.filter(function (class_) { return class_.application == true; });
      self._grid.data(menus);
      self._grid.refresh();
    });
  };
  
  MenuView.prototype.refresh = function () {
    this._grid.refresh();
  };
  
  MenuView.prototype.init= function (selector, class_id, object_id) {
    this._selector = selector;
    this._class_id = class_id;
    this._object_id = object_id;
    this._grid = new Grid();
    var view = $(selector)
    var class_ = null;
    var classes = null;
    var self = this;
    var grid_selector = selector + "> div.menuview-panel > div.menu-list";
    $.when(
      Utils.load_css("/core/Control/View/MenuView.css"),
      Connector.crud.read("api/" + Class.CLASS_ID, "json", function (data) { classes = data; }),
      Connector.crud.read("api/" + Class.CLASS_ID + "/" +  Class.CLASS_ID, "json", function (data) { class_ = data; })
    ).always(function() {
      view.append(TEMPLATE);
      var columns = Grid.create_columns(class_);
      self._grid.init(grid_selector, columns)
      .then(function () {
        self._grid.add_operation("click", MenuView.show_gridview);
        var menus = classes.filter(function(class_) {
          return class_.application == true;
        });
        self._grid.data(menus);
        self.refresh();
      });
    });
  };
  
  return MenuView;
});
