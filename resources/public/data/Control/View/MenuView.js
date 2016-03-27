define(function (require) {
  require("jquery");
  require("jsrender");
  var app = require("app");
  var Utils = require("data/Core/Utils");
  var Toolbar = require("data/Control/Toolbar");
  var Detail = require("data/Control/Detail");
  var Grid = require("data/Control/Grid");
  var Tabs = require("data/Control/Tabs");
  
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
    var index = event.recid;
    var tab_id = tab.prop("id");
    var ids = tab_id.split("_");
    var prefix = 0 < ids.length ? ids[0] : null;
    var class_id = 1 < ids.length ? ids[1] : null;
    var object_id = 2 < ids.length ? ids[2] : null;

    // Get clicked data (from 'tab_id'->'view'->'grid'->'data'-> item of the selected index row.)
    var view = app.contents().content(tab_id);
    var grid = view.list();
    var data = grid.data()[index];
    //app.contents().show_tab(data.label, null, "GridView", data.id, null);
    app.contents().show_tab(data.label, null, "ListView", data.id, null);
  };
  
  MenuView.prototype.list = function () {
    return this._grid;
  };
  
  MenuView.prototype.update = function (keys) {
  	var target = false;
  	for (var i = 0; i < keys.length; i++) {
  	  var key = keys[i];
  	  if (key.class_id == Utils.CLASS_ID) {
  	    target = true;
  	    break;
  	  }
  	}

  	if (!target) {
  	  return;
  	}

    var classes = null;
    var self = this;
    Utils.get_data(Utils.CLASS_ID, null, function (data) { classes = data; })
    .then(function () {
      self._grid.data(classes);
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
    Utils.add_css("/data/Style/View/MenuView.css");
    $.when(
      Utils.get_data(Utils.CLASS_ID, null, function (data) { classes = data; })
      ,Utils.get_data(Utils.CLASS_ID, Utils.CLASS_ID, function (data) { class_ = data; })
    ).always(function() {
      view.append(TEMPLATE);
      var columns = Grid.create_columns(class_);
      self._grid.init(grid_selector, columns)
      .then(function () {
        self._grid.add_operation("click", MenuView.show_gridview);
        self._grid.data(classes);
        self.refresh();
      });
    });
  };
  
  return MenuView;
});
