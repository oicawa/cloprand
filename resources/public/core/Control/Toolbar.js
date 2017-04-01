define(function (require) {
  require("jquery");
  var Utils = require("core/Utils");
  var Uuid = require("core/Uuid");
  var Class = require("core/Class");
  var Storage = require("core/Storage");
  var Locale = require("core/Locale");
  
  var TEMPLATE = '<div></div>';
  
  var CONVERTERS = {
    "e14d8e9f-846e-40be-8003-b7f31e6a662c" : function (src_item, items_map, context) {
      var dfd = new $.Deferred;
      var type_id = src_item.type.id;
      var properties = src_item.type.properties;
      var menu_type = null;
      var entry = null;
      $.when(
        Storage.read(Class.MENU_ITEM_TYPE_ID, type_id).done(function (data) { menu_type = data; }),
        Storage.read(Class.FUNCTION_ENTRY_ID, properties.function_entry.id).done(function (data) { entry = data; })
      )
      .then(function() {
        require([entry.require_path], function(Module) {
          var func = Module[entry.function_name];
          // { id:"search", type:"html",   text:"Search", icon:"fa fa-search",     html:search_generator }
          items_map[properties.item_id] = {
            id      : properties.item_id,
            type    : menu_type.type,
            text    : Locale.translate(properties.caption),
            icon    : "fa " + properties.icon,
            action  : func,
            context : context
          }
          dfd.resolve();
        });
      });
      return dfd.promise();
    },
    "0d75de1d-2d9c-4f85-a313-4ab39ee6af62" : function (src_item, items_map, context) {
      var dfd = new $.Deferred;
      var type_id = src_item.type.id;
      var properties = src_item.type.properties;
      var menu_type = null;
      var submenu_items = null;
      $.when(
        Storage.read(Class.MENU_ITEM_TYPE_ID, type_id).done(function (data) { menu_type = data; }),
        Toolbar.items(properties.submenu_items, context).done(function (dst_items) { submenu_items = dst_items; })
      )
      .then(function() {
        items_map[properties.item_id] = {
          id      : properties.item_id,
          type    : menu_type.type,
          text    : Locale.translate(properties.caption),
          icon    : "fa " + properties.icon,
          items   : submenu_items,
          context : context
        }
        dfd.resolve();
      });
      return dfd.promise();
    }
  };
  
  function Toolbar() {
    this._root = null;;
    this._toolbar = null;
    this._css = null;
    this._instance = this;
    this._operations = {};
  }

  Toolbar.prototype.init = function(selector) {
    var dfd = new $.Deferred;
    this._root = $(selector);
    this._root.hide();
    
    var self = this;
    
    Utils.load_css("/core/Control/Toolbar.css")
    .then(function() {
      self._root.append(TEMPLATE);
      var name = Uuid.version4();
      var toolbar = self._root.find("div");
      toolbar.w2toolbar({
        name : name,
      });
      self._toolbar = w2ui[name];
      self._toolbar.onClick = function (event) {
        var id = event.target;
        var item = self._toolbar.get(id);
        if (!item.action) {
          return;
        }
        item.action(event);
      }
      self._root.hide();
      dfd.resolve();
    });
    return dfd.promise();
  };
  
  Toolbar.prototype.items = function(items) {
    if (!items) {
      return;
    }
    
    this._toolbar.items = items;
    // !!! The follow logic is dirty hack !!!
    // <<Reason>>
    // The added all items are not displayed at once.
    // Calling 'refresh' method of toolbar once, only one displayed item is added in toolbar.
    // So, I implement it temporarily to call the 'refresh' method for the number of items.
    // This issue have to be investigated, and be fixed...
    for (var i = 0; i < items.length; i++) {
      this._toolbar.refresh();
    }
  };

  Toolbar.prototype.visible = function(on) {
    if (on) {
      this._root.show();
    } else {
      this._root.hide();
    }
  };

  Toolbar.prototype.show = function(button_name) {
    this._toolbar.show(button_name);
  };

  Toolbar.prototype.hide = function(button_name) {
    this._toolbar.hide(button_name);
  };

  Toolbar.converter = function (menu_type) {
    
  };
  
  Toolbar.items = function (src_items, context) {
    var dfd = new $.Deferred;
    
    if (!src_items) {
      dfd.resolve();
      return dfd.promise();
    }
    var promises = [];
    var items_map = {};
    for (var i = 0; i < src_items.length; i++) {
      var src_item = src_items[i];
      var converter = CONVERTERS[src_item.type.id];
      if (!converter) {
        console.assert(false, "NO converter in CONVERTERS table. (src_item.type.id=[" + src_item.type.id + "])");
        continue;
      }
      var promise = converter(src_item, items_map, context);
      promises.push(promise);
    }
    
    $.when.apply(null, promises)
    .done(function() {
      var dst_items = [];
      for (var i = 0; i < src_items.length; i++) {
        var src_item = src_items[i];
        var item_id = src_item.type.properties.item_id;
        var dst_item = items_map[item_id];
        dst_items.push(dst_item);
      }
      dfd.resolve(dst_items);
    });
    
    return dfd.promise();
  };

  return Toolbar;
}); 
