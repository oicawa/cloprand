define(function (require) {
  require('jquery');
  require('json2');
  
  function Class(_class) {
    this._class = _class;
  }
  
  Class.CLASS_ID = "a7b6a9e1-c95c-4e75-8f3d-f5558a264b35";
  Class.PRIMITIVE_ID = "1fd7625f-78b5-4079-95dd-951186cb79fe";
  Class.SYSTEM_ID = "15ab1b06-3756-48df-b045-728499aa9a6c";
  Class.FIELD_ID = "d2992e38-6190-4ca4-94bf-db44328dfd37";
  
  Class.prototype.caption_names = function() {
    var names = this._class.object_fields
      .filter(function (field) { return !(!field.caption); })
      .map(function(field){ return field.name; });
    return names;
  };
  
  Class.prototype.captions = function(objects) {
    var names = this.caption_names();
    var captions = objects
      .map(function(object) {
         return names
           .map(function(name) { return object[name]; })
           .join(" ");
      });
    return captions;
  };
  
  return Class;
});
