define(function (require) {
  require("jquery");
  var Utils = require("core/Utils");
  var Uuid = require("core/Uuid");
  var Class = require("core/Class");
  var Storage = require("core/Storage");
  var Locale = require("core/Locale");
  
  var TEMPLATE = '<div></div>';

  var Menu = {};
  
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
          items_map[properties.menu_id] = {
            id      : properties.item_id,
            type    : menu_item_type.type,
            text    : Locale.translate(properties.caption),
            icon    : "fa " + properties.icon,
            action  : Module[entry.function_name],
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

  return Menu;
}); 
