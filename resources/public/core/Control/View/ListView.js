define(function (require) {
  require("jquery");
  var app = require("app");
  var Utils = require("core/Utils");
  var Uuid = require("core/Uuid");
  var Class = require("core/Class");
  var Storage = require("core/Storage");
  var Contents = require("core/Contents");
  var Toolbar = require("core/Control/Toolbar");
  var Grid = require("core/Control/Grid");

  var TEMPLATE = '' +
'<div class="listview-panel">' +
'  <div class="object-operations"></div>' +
'  <div class="object-list">' +
'    <div><a href="#"></a></div>' +
'  </div>' +
'</div>';

  function show_tab(tab_id, label) {
    var tabTemplate = "<li class='tab-label'><a href='#{href}'>#{label}</a><span class='ui-icon ui-icon-close'>Remove Tab</span></li>"
    var id = "object-new-" + (new Date()).getTime();
    var li = $(tabTemplate.replace( /#\{href\}/g, "#" + id ).replace( /#\{label\}/g, label ) );
    var tabs = $("#object-detail-tabs");
    tabs.find(".ui-tabs-nav").append(li);
    tabs.append("<div id='" + id + "' class='tab-panel'><div class='tab-contents-panel'><div class='object_detail'></div></div></div>");
    tabs.tabs("refresh");
  }

  function ListView () {
    this._class_id = null;
    this._class = null;
    this._toolbar = null;
    this._grid = null;
  }
  
  ListView.create = function (event) {
    var tab_info = Contents.get_tab_info(event);
    var view = app.contents().content(tab_info.tab_id);
    app.contents().show_tab("New " + view._class.label, null, "DetailView", tab_info.class_id, Uuid.NULL);
  };

  ListView.show_detail = function (event) {
    var tab_info = Contents.get_tab_info(event);
    var index = event.recid - 1;
    
    // Get clicked data (from 'tab_id'->'view'->'grid'->'data'-> item of the selected index row.)
    var view = app.contents().content(tab_info.tab_id);
    var grid = view.list();
    var data = grid.get(event.recid);
    var class_ = view._class;
    
    var fields = class_.object_fields;
    var caption_field_names = fields.filter(function (field, index) { return !(!field.caption); })
                                    .map(function (field) { return field.name; });
    var key_field_names = fields.filter(function (field, index) { return !(!field.key); })
                                .map(function (field) { return field.name; });
    key_field_names.push("id");
    console.assert(0 < caption_field_names.length, caption_field_names);
    console.assert(0 < key_field_names.length, key_field_names);

    var caption_field_name = caption_field_names[0];
    var key_field_name = key_field_names[0];
    
    var caption = caption_field_names.map(function(name) { return data[name] }).join(" ");
    var key = data[key_field_name];
    app.contents().show_tab(caption, null, "DetailView", tab_info.class_id, key);
  };
  
  ListView.prototype.update = function (keys) {
    var target = false;
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key.class_id == this._class_id) {
        target = true;
        break;
      }
    }

    if (!target) {
      return;
    }

    var self = this;
    Storage.read(key.class_id)
    .done(function (objects) {
      self._grid.data(objects);
      self._grid.refresh();
    });
  };
  
  ListView.prototype.add = function () {
    var url = location.protocol + "//" + locatione.host + "/" + _class_id + "/" + Uuid.NULL + "/index.html";
    window.open(url, "object-" + _class_id + "/" + Uuid.NULL);
  };
  
  ListView.prototype.list = function () {
    return this._grid;
  };
  
  ListView.prototype.refresh = function () {
    this._grid.refresh();
  };

  ListView.prototype.init = function (selector, class_id, object_id) {
    this._class_id = class_id;
    this._toolbar = new Toolbar();
    this._grid = new Grid();
    var view = $(selector)
    var objects = null;
    var assist = null;
    var self = this;
    var toolbar_selector = selector + "> div.listview-panel > div.object-operations";
    var list_selector = selector + "> div.listview-panel > div.object-list";
    var columns = null;
    $.when(
      Utils.load_css("/core/Control/View/ListView.css"),
      Storage.read(class_id).done(function (data) { objects = data; }),
      Storage.read(Class.CLASS_ID, class_id).done(function (data) { self._class = data; })
    )
    .then(function() {
      return Grid.create_columns(self._class)
      .done(function(columns_) {
        columns = columns_;
      })
    })
    .then(function() {
      view.append(TEMPLATE);

      // Toolbar
      var default_toolbar = {"items": [
        {"name": "create", "caption": "Create", "description": "Create new data"}
      ]};
      var assist_toolbar = !assist ? default_toolbar : (!assist.toolbar ? default_toolbar : assist.toolbar);
      self._toolbar.init(toolbar_selector, assist_toolbar);
      self._toolbar.bind("create", ListView.create);

      // Grid
      self._grid.init(list_selector, columns)
      .then(function () {
        self._grid.add_operation("dblclick", ListView.show_detail);
        self._grid.select_column(true);
        self._grid.data(objects);
        self._toolbar.visible(true);
        self.refresh();
      });
    });
  };

  return ListView;
});
