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
  var DivButton = require("core/Control/DivButton");
  var Locale = require("core/Locale");
  
  var TEMPLATE = '<div class="menuview-panel"><div class="menu-list"></div></div>';
  var TEMPLATE_ITEM = '<div class="menuview-item"><div>';

  function MenuView() {
    this._selector = null;
    this._class_id = null;
    this._object_id = null;
    this._classes = null;
  }
  
  MenuView.id = "676138ed-aee1-4d6d-a8d8-c114042b1833";
  var CLASS_TYPE_ID_SINGLE = "ac9d589b-c421-40b8-9497-b0caaf24d017";
  var CLASS_TYPE_ID_MULTI = "b72dc321-5278-42da-8738-3503ae64bcad";
  
  function open_list_view(class_) {
    var view_id = class_.class_type.properties.list_view.id;
    var caption = Locale.translate(class_.label);
    app.contents().tabs().show_tab(caption, null, view_id, class_.id, null);
  }
  
  function open_detail_view(class_) {
    var view_id = class_.class_type.properties.detail_view.id;
    Storage.read(class_.id).done(function(object_maps) {
      var objects = Object.keys(object_maps).map(function(id) { return object_maps[id]; });
      if (objects.length == 0) {
        app.contents().tabs().show_tab("New " + Locale.translate(class_.label), null, view_id, class_.id, Uuid.NULL);
        return;
      }
      (new Class(class_)).renderer().done(function (renderer) {
        var caption = renderer(objects[0]);
        app.contents().tabs().show_tab(caption, null, view_id, class_.id, objects[0].id);
      });
    });
  }
  
  MenuView.open = function (class_) {
    console.log(class_);
    if (class_.class_type.id == CLASS_TYPE_ID_MULTI) {
      open_list_view(class_);
    } else if (class_.class_type.id == CLASS_TYPE_ID_SINGLE) {
      open_detail_view(class_);
    } else {
      console.assert(false, "Unsupported View ID = [" + class_.class_type.id + "]");
    }
  };
  
  MenuView.prototype.list = function () {
    //return this._grid;
    console.assert(false, "Called MenuView.prototype.list()");
    return null;
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
      //self._grid.data(menus);
      //self._grid.refresh();
    });
  };
  
  MenuView.prototype.refresh = function () {
    // this._grid.refresh();
    console.log("Called MenuView.prototype.refresh()");
  };
  
  function create_item(selector, menu_box, class_) {
    var caption = Locale.translate(class_.label);
    
    menu_box.append(TEMPLATE_ITEM);
    var menu_item = menu_box.find("div.menuview-item:last-child");
    menu_item.attr("name", class_.id);
    menu_item.attr("title", caption);
    
    var button_selector = selector + " > div.menuview-item[name='" + class_.id + "']";
    var button = new DivButton();
    button.init(button_selector, "<i class='fa " + class_.icon + " fa-3x fa-fw'/><span class='menuview-item-caption'>" + caption + "</span>", function (evnet) {
      MenuView.open(class_);
    });
  }
  
  function create_items(selector, class_map) {
    // clear
    var menu_box = $(selector);
    menu_box.empty();
    
    var classes = Object.keys(class_map).map(function(id) { return class_map[id]; });
    for (var i = 0; i < classes.length; i++) {
      var class_ = classes[i];
      create_item(selector, menu_box, class_);
    }
  }
  
  MenuView.prototype.init= function (selector, class_id, object_id) {
    var dfd = new $.Deferred;
    this._selector = selector;
    this._class_id = class_id;
    this._class = null;
    this._object_id = object_id;
    this._classes = null;
    var view = $(selector)
    var self = this;
    var items_selector = selector + "> div.menuview-panel > div.menu-list";
    var options = {};
    $.when(
      Utils.load_css("/core/Control/View/MenuView.css"),
      Storage.read(Class.CLASS_ID).done(function(data) { self._classes = data; })
    )
    .then(function() {
      self._class = self._classes[Class.CLASS_ID];
      return Class.field_map(self._class).done(function(field_map) { options.field_map = field_map; });
    })
    .then(function() {
      options.columns = Grid.columns(self._class, options.field_map);
    })
    .then(function() {
      view.append(TEMPLATE);
      return create_items(items_selector, self._classes);
    })
    .then(function () {
      self.refresh();
    })
    .then(function () {
      dfd.resolve(self);
    });
    return dfd.promise();
  };
  
  return MenuView;
});
