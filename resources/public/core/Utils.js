define(function (require) {
  require('jquery');
  require('json2');
  
  var _CLASS_ID = "a7b6a9e1-c95c-4e75-8f3d-f5558a264b35";
  var _PRIMITIVE_ID = "1fd7625f-78b5-4079-95dd-951186cb79fe";
  var _SYSTEM_ID = "15ab1b06-3756-48df-b045-728499aa9a6c";
  
  function create_path() {
    var args = Array.prototype.slice.call(arguments);
    var result = args.every(function(arg) { return arg == null || typeof arg == "string"; });
    console.assert(result, args);
    var path = args.reduce(function (prev, current, index, array) {
      var adding = (current == null || current.length == 0) ? "" : "/" + encodeURIComponent(current);
      return (prev == null ? "" : prev) + adding;
    });
    return path.substr(0, 1) == "/" ? path : "/" + path;
  }
  
  return {
    CLASS_ID : _CLASS_ID,
    PRIMITIVE_ID : _PRIMITIVE_ID,
    SYSTEM_ID : _SYSTEM_ID,
    load_css: function(path) {
    　　var dfd = new $.Deferred;
      var head = $("head");
      var css = head.children("link[href='" + path + "']");
      if (0 < css.length) {
        dfd.resolve();
        return dfd.promise();
      }
      
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = path;
      link.onload = function() {
        dfd.resolve();
      };
      
      head.append(link);
      
      return dfd.promise();
    },
    property_value : function(instance, property, method_name, value) {
      if (value.length == 0) {
        return property[method_name]();
      } else if (value.length == 1) {
        property[method_name](value[0]);
        return instance;
      } else {
        console.assert(false, arguments);
      }
    },
    
    get_caption : function(class_, object_) {
      var names = class_.object_fields.filter(function (field) { return !(!field.caption); }).map(function(field){ return field.name; });
      var value = names.map(function(name) { return object_[name]; }).join(" ");
      return value;
    }
  };
});
