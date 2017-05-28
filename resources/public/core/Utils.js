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
      var url = path + '?ver=' + (new Date()).getTime();
      var css = head.children("link[href='" + url + "']");
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
    get_as_json : function(default_json, assign_func) {
      var new_json = JSON.parse(JSON.stringify(default_json));
      try {
        
        var assigned_object = assign_func();
        if (!assigned_object) {
          return new_json;
        }

        if ((!is_object(assigned_object)) && (!Array.isArray(assigned_object))) {
          return new_json;
        }

        if (Array.isArray(assigned_object)) {
          return assigned_object;
        }

        for (var key in new_json) {
          var v = assigned_object[key];
          if (!v || v === "") {
            continue;
          }
          new_json[key] = v;
        }
        return new_json;
      } catch (ex) {
        console.assert(false, ex);
        return new_json;
      }
    },
    is_object : function (target) {
      return is_object(target);
    },
    clone : function(json_object) {
      return JSON.parse(JSON.stringify(json_object));
    },
    is_asc : function(sort_direction_id) {
      var ASC = "607ce339-8517-4271-8ba6-f4dd35a2b940";
      var DESC = "5d15314e-4952-4310-b410-4dd8a388177e";
      if (sort_direction_id == ASC) {
        return true;
      } else if (sort_direction_id == DESC) {
        return false;
      } else {
        return null;
      }
    },
  };
});
