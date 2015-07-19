define(function (require) {
  require("jquery");
  require("jquery_splitter");
  require("jsrender");
  var Utils = require("core/Utils");
  var Toolbar = require("controls/Toolbar/Toolbar");
  var Detail = require("controls/Detail/Detail");
  var Grid = require("controls/Grid/Grid");
  var Contents = require("Contents");
  var app = require("app");

  function show_tab(tab_id, label) {
    var tabTemplate = "<li class='tab-label'><a href='#{href}'>#{label}</a><span class='ui-icon ui-icon-close'>Remove Tab</span></li>"
    var id = "object-new-" + (new Date()).getTime();
    var li = $(tabTemplate.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label ) );
    var tabs = $("#object-detail-tabs");
    tabs.find(".ui-tabs-nav").append(li);
    tabs.append("<div id='" + id + "' class='tab-panel'><div class='tab-contents-panel'><div class='object_detail'></div></div></div>");
    tabs.tabs("refresh");
  }

  function GridView () {
    this._class_id = null;
    this._class = null;
    this._toolbar = null;
    this._grid = null;
  }
  
  GridView.create = function (event) {
    var tab_info = Contents.get_tab_info(event);
    var view = app.contents().content(tab_info.tab_id);
    app.contents().show_tab("DetailView", tab_info.class_id, Utils.NULL_UUID, "New " + view._class.label);
  };

  GridView.show_detail = function (event) {
    var tab_info = Contents.get_tab_info(event);
    var tr = $(event.target).closest("tr");
    var index = tr.index();
    
    // Get clicked data (from 'tab_id'->'view'->'grid'->'data'-> item of the selected index row.)
    var view = app.contents().content(tab_info.tab_id);
    var grid = view.list();
    var data = grid.data()[index];
    var class_ = view._class;
    var field_name = null;
    for (var i = 0; i < class_.object_fields.length; i++) {
      var object_field = class_.object_fields[i];
      if (!object_field.caption) {
        continue;
      }
      field_name = object_field.name;
      break;
    }
    var caption = data[field_name];
    app.contents().show_tab("DetailView", tab_info.class_id, data.uuid, caption);
  };
  
  GridView.prototype.update = function (class_id, object_id, data) {
    console.assert(class_id == this._class_id, "class_id=" + class_id + ", this._class_id=" + this._class_id);
    console.assert(object_id && Utils.UUID.test(object_id) && object_id != Utils.NULL_UUID, "object_id=" + object_id);
    this._grid.update(object_id, data);
  };
  
  GridView.prototype.add = function () {
    var url = location.protocol + "//" + location.host + "/" + _class_id + "/" + Utils.NULL_UUID + "/index.html";
    window.open(url, "object-" + _class_id + "/" + Utils.NULL_UUID);
  };
  
  GridView.prototype.list = function () {
    return this._grid;
  };
  
  GridView.prototype.init = function (selector, class_id, object_id) {
    this._class_id = class_id;
    this._toolbar = new Toolbar();
    this._grid = new Grid();
    var view = $(selector)
    var classes = null;
    var template = null;
    var assist = null;
    var self = this;
    var toolbar_selector = selector + "> div.gridview-panel > div.object-operations";
    var grid_selector = selector + "> div.gridview-panel > div.object-list";
    Utils.add_css("/controls/views/GridView/GridView.css");
    $.when(
      Utils.get_template("controls/views", "GridView", function (data) { template = $.templates(data); }),
      //Utils.get_file(class_id, "GridView.json", "json", function (data) { assist = data; }),
      Utils.get_data(class_id, null, function (data) { classes = data; }),
      Utils.get_data(Utils.CLASS_UUID, class_id, function (data) { self._class = data; })
    ).then(function() {
      var view_html = template.render();
      view.append(view_html);

      // Toolbar
      var default_toolbar = {"items": [{"name": "create", "caption": "Create", "description": "Create new data"}]};
      var assist_toolbar = !assist ? default_toolbar : (!assist.toolbar ? default_toolbar : assist.toolbar);
      self._toolbar.init(toolbar_selector, assist_toolbar);
      self._toolbar.bind("create", GridView.create);

      // Grid
      self._grid.init(grid_selector, self._class)
      .then(function () {
        self._grid.add_operation("click", GridView.show_detail);
        self._grid.data(classes);
        self._toolbar.visible(true);
      });
    });
  };

  return GridView;
});
