define(function (require) {
  require('jquery');
  require('json2');
  
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

  function is_object(target) {
    return target instanceof Object && Object.getPrototypeOf(target) === Object.prototype;
  }    
  
  return {
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
    object : function(default_object, assign_func) {
      try {
        var assigned_object = assign_func();
        if (!assigned_object) {
          return default_object; 
        }
        if (!is_object(assigned_object)) {
          return default_object;
        }
        var new_object = default_object;
        for (var key in assigned_object) {
          new_object[key] = assigned_object[key];
        }
        return new_object;
      } catch (ex) {
        console.assert(false, ex);
        return default_value;
      }
    },
    is_object : function (target) {
      return is_object(target);
    },
    localed : function(value) {
      return value[""];
    }
  };
});
