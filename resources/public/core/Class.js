define(function (require) {
  require('jquery');
  require('json2');
  var Utils = require('core/Utils');
  var Locale = require('core/Locale');
  var Storage = require('core/Storage');
  
  function Class(_class) {
    this._class = _class;
  }
  
  Class.CLASS_ID = "a7b6a9e1-c95c-4e75-8f3d-f5558a264b35";
  Class.PRIMITIVE_ID = "1fd7625f-78b5-4079-95dd-951186cb79fe";
  Class.SYSTEM_ID = "15ab1b06-3756-48df-b045-728499aa9a6c";
  Class.FIELD_ID = "d2992e38-6190-4ca4-94bf-db44328dfd37";
  Class.WEBFONTS_SETS_ID = '43a28dff-bc30-452e-b748-08235443b7ce';
  Class.LOCALE_ID = '917b793a-c1a9-4736-84ff-3e10c6e4a95f';
  Class.TEXT_MULTILINGUALIZATION_ID = 'f4ce98bf-27f9-4319-a112-95e529bc9ff9';
  Class.TEXTLINES_MULTILINGUALIZATION_ID = '48a93daf-9829-4bb8-9760-152491ed7a72';
  Class.FUNCTION_ENTRY_ID = 'f447764e-45fe-425e-9b2b-6ae5e7760b2f';
  Class.MENU_ITEM_TYPE_ID = 'c4e3e6d0-3d4d-439c-9fea-361f0afed10e';

  Class.prototype.caption_fields = function() {
    return this._class.object_fields
      .filter(function (field) { return !(!field.caption); })
  };
  
  Class.prototype.captions = function(objects) {
    var fields = this.caption_fields();
    var captions = objects
      .map(function(object) {
         if (!object) {
           return "";
         }
         return fields
           .map(function(field) {
             var value = object[field.name];
             if (Utils.is_object(value) && field.datatype.properties.multi_lingualization) {
               return Locale.translate(value);
             } else {
               return value;
             }
           })
           .join(" ");
      });
    return captions;
  };
  
  Class.prototype.detail_actions = function() {
    return get_actions(this, "detail_actions");
  };
  
  Class.prototype.list_actions = function() {
    return get_actions(this, "list_actions");
  };

  return Class;
});
