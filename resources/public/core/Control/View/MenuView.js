define(function (require) {
  require("jquery");
  var app = require("app");
  var Utils = require("core/Utils");
  var Uuid = require("core/Uuid");
  var Class = require("core/Class");
  var Connector = require("core/Connector");
  var Storage = require("core/Storage");
  var Grid = require("core/Control/Grid");
  var ListView = require("core/Control/View/ListView");
  
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
  
  MenuView.id = "676138ed-aee1-4d6d-a8d8-c114042b1833";
  
  MenuView.show_gridview = function (self, recid) {
    var data = self._grid.get(recid);
    var captions = (new Class(self._class)).captions([data]);
    app.contents().tabs().show_tab(captions[0], null, ListView.id, data.id, null);
  };
  
  MenuView.prototype.list = function () {
    return this._grid;
  };
  
  MenuView.prototype.caption = function () {
    return "Menu";
  };

  function menu_filter(class_) {
    if (!class_.class_type) {
      return false;
    }
    if (class_.class_type.id == "949c12c1-48c5-450a-bb2c-222fdf0a0734") {
      return false;
    }
    return true;
  }
  
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

    var self = this;
    Storage.read(Class.CLASS_ID)
    .done(function (classes) {
      var menus = Object.keys(classes).map(function(id) { return classes[id]; }).filter(menu_filter);
      self._grid.data(menus);
      self._grid.refresh();
    });
  };
  
  MenuView.prototype.refresh = function () {
    this._grid.refresh();
  };
  
  MenuView.prototype.init= function (selector, class_id, object_id) {
    var dfd = new $.Deferred;
    this._selector = selector;
    this._class_id = class_id;
    this._class = null;
    this._object_id = object_id;
    this._grid = new Grid();
    var view = $(selector)
    var classes = null;
    var self = this;
    var grid_selector = selector + "> div.menuview-panel > div.menu-list";
    var columns = null;
    $.when(
      Utils.load_css("/core/Control/View/MenuView.css"),
      Storage.read(Class.CLASS_ID).done(function(data) { classes = data; })
    )
    .then(function() {
      self._class = classes[Class.CLASS_ID];
      return Grid.create_columns(self._class).done(function(columns_) { columns = columns_; });
    })
    .then(function() {
      view.append(TEMPLATE);
      return self._grid.init(grid_selector, columns);
    })
    .then(function () {
      self._grid.double_click = function(event) {
        MenuView.show_gridview(self, event.recid);
      };
      self._grid.select_column(true);
      self._grid.toolbar(true);

      function search_generator(item) {
        var template = "<div id={{ID}} style='margin:0px 5px 0px 5px;'><i class='{{ICON}}'style='margin:2px;'/><input type='text' class='w2ui-grid w2ui-toolbar-search'/></div>";
        var id = Uuid.version4();
        var html = template.replace(/{{ID}}/, id)
                           .replace(/{{ICON}}/, item.icon);
        var selector = "#" + id + " > input";
        console.log("search selector: [" + selector + "]");
        $(document).off("keyup", selector);
        $(document).on("keyup", selector, function (event) {
          console.log("Current Text:[" + $(selector).val() + "]");
        });
        return html;
      }

      var menus = Object.keys(classes).map(function(id) { return classes[id]; }).filter(menu_filter);
      self._grid.data(menus);
      self.refresh();
    })
    .then(function () {
      dfd.resolve(self);
    });
    return dfd.promise();
  };
  
  return MenuView;
});
