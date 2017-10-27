define(function (require) {
  require("jquery");
  var Utils = require("core/Utils");
  var Uuid = require("core/Uuid");
  var Class = require("core/Class");
  var Storage = require("core/Storage");
  var Locale = require("core/Locale");
  
  var TEMPLATE = '<div></div>';

  var Menu = {};
  
  var MENU_ITEM_ID = "bdd98949-5829-4a41-91bf-d1680fb473d2";
  
  var CONVERTERS = {
    "e14d8e9f-846e-40be-8003-b7f31e6a662c" : function (src_item, items_map, context) {
      var dfd = new $.Deferred;
      var type_id = src_item.type.id;
      var properties = src_item.type.properties;
      var menu_item_type = null;
      var entry = null;
      $.when(
        Storage.read(Class.MENU_ITEM_TYPE_ID, type_id).done(function (data) { menu_item_type = data; }),
        Storage.read(Class.FUNCTION_ENTRY_ID, properties.function_entry.id).done(function (data) { entry = data; })
      )
      .then(function() {
        require([entry.require_path], function(Module) {
          items_map[properties.item_id] = {
            id             : properties.item_id,
            type           : menu_item_type.type,
            text           : Locale.translate(properties.caption),
            icon           : "fa " + properties.icon,
            action         : Module[entry.function_name],
            context        : context,
            function_entry : properties.function_entry
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
      var menu_item_type = null;
      var submenu_items = null;
      $.when(
        Storage.read(Class.MENU_ITEM_TYPE_ID, type_id).done(function (data) { menu_item_type = data; }),
        Menu.convert(properties.submenu_items, context).done(function (dst_items) { submenu_items = dst_items; })
      )
      .then(function() {
        items_map[properties.item_id] = {
          id      : properties.item_id,
          type    : menu_item_type.type,
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
  
  Menu.convert = function (src_items, context) {
    var dfd = new $.Deferred;
    
    if (!src_items) {
      dfd.resolve();
      return dfd.promise();
    }
    
    var all_menus = null;
    var promises = [];
    Storage.read(MENU_ITEM_ID).done(function (data) { all_menus = data; })
    .then(function() {
      var src_menus = src_items.map(function(src_item) { return Uuid.is_uuid(src_item) ? all_menus[src_item] : src_item; });
      var items_map = {};
      for (var i = 0; i < src_menus.length; i++) {
        var src_menu = src_menus[i];
        var converter = CONVERTERS[src_menu.type.id];
        if (!converter) {
          console.assert(false, "NO converter in CONVERTERS table. (The target menu item type id=[" + src_menu.type.id + "])");
          continue;
        }
        var promise = converter(src_menu, items_map, context);
        promises.push(promise);
      }
      
      $.when.apply(null, promises)
      .done(function() {
        var dst_menus = [];
        for (var i = 0; i < src_menus.length; i++) {
          var src_menu = src_menus[i];
          var item_id = src_menu.type.properties.item_id;
          var dst_menu = items_map[item_id];
          dst_menus.push(dst_menu);
        }
        dfd.resolve(dst_menus);
      });
    });
    
    return dfd.promise();
  };

  return Menu;
}); 
