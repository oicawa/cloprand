define(function (require) {
  require("jquery");
  require("jquery_splitter");
  require("jsrender");
  var Utils = require("core/Utils");
  var Toolbar = require("controls/Toolbar/Toolbar");
  var Detail = require("controls/Detail/Detail");
  var Grid = require("controls/Grid/Grid");
  var Tabs = require("controls/Tabs/Tabs");
  var app = require("app");

  function MenuView() {
  	this._selector = null;
  	this._class_id = null;
  	this._object_id = null;
    this._grid = null;
  }
  
  MenuView.show_gridview = function (event) {
    // Get event source information
    var tab = $(event.target).closest("div.tab-panel");
    var tr = $(event.target).closest("tr");
    var index = tr.index();
    var tab_id = tab.prop("id");
    var ids = tab_id.split("_");
    var prefix = 0 < ids.length ? ids[0] : null;
    var class_id = 1 < ids.length ? ids[1] : null;
    var object_id = 2 < ids.length ? ids[2] : null;

    // Get clicked data (from 'tab_id'->'view'->'grid'->'data'-> item of the selected index row.)
    var view = app.contents().content(tab_id);
    var grid = view.list();
    var data = grid.data()[index];
    app.contents().show_tab(data.label, null, "GridView", data.uuid, null);
  };
  
  MenuView.prototype.list = function () {
    return this._grid;
  };
  
  MenuView.prototype.update = function (keys) {
  	var target = false;
  	for (var i = 0; i < keys.length; i++) {
  	  var key = keys[i];
  	  if (key.class_id == Utils.CLASS_UUID) {
  	    target = true;
  	    break;
  	  }
  	}

  	if (!target) {
  	  return;
  	}

    var classes = null;
    var self = this;
    Utils.get_data(Utils.CLASS_UUID, null, function (data) { classes = data; })
    .then(function () {
      self._grid.data(classes);
    });
  };
  
  MenuView.prototype.init= function (selector, class_id, object_id) {
    this._selector = selector;
  	this._class_id = class_id;
  	this._object_id = object_id;
  	this._grid = new Grid();
    var view = $(selector)
  	var template = null;
    var assist = null;
    var class_ = null;
    var classes = null;
    var self = this;
    var grid_selector = selector + "> div.menuview-panel > div.menu-list";
    Utils.add_css("/controls/views/MenuView/MenuView.css");
    $.when(
      Utils.get_template("controls/views", "MenuView", function (data) { template = $.templates(data); })
      ,Utils.get_file(null, "controls/views/MenuView/MenuView.json", "json", function (data) { assist = data; })
      ,Utils.get_data(Utils.CLASS_UUID, null, function (data) { classes = data; })
      ,Utils.get_data(Utils.CLASS_UUID, Utils.CLASS_UUID, function (data) { class_ = data; })
    ).always(function() {
      var view_html = template.render();
      view.append(view_html);
      var columns = Grid.create_columns(class_);
      self._grid.init(grid_selector, columns)
      .then(function () {
        self._grid.add_operation("click", MenuView.show_gridview);
        self._grid.data(classes);
      });
    });
  };
  
  return MenuView;
});
