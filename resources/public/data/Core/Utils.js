define(function (require) {
  require('jquery');
  require('json2');
  
  var _CLASS_ID = "Class";
  var _PRIMITIVE_ID = "Primitive";
  
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
    load_css: function(path) {
      var head = $("head");
      var css = head.children("link[href='" + path + "']");
      if (0 < css.length) {
        //console.log("[" +path + "]: already included (count=" + css.length + ")");
        return;
      }
      head.append("<link rel='stylesheet' type='text/css' href='" + path + "?_=" + (new Date()).getTime() + "'></link>");
      //head.append("<link rel='stylesheet' type='text/css' href='" + path + "' />");
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
