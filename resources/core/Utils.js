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

  var Utils = {
    load_css: function(path) {
      var dfd = new $.Deferred;
      var head = $("head");
      var url = path + '?ver=' + (new Date()).getTime();
      //console.log("css URL=[" + url + "]");
      var css = head.children("link[href='" + url + "']");
      //console.log("css.length=" + css.length);
      if (0 < css.length) {
        dfd.resolve();
        return dfd.promise();
      }
      
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = url;
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

        if ((!is_object(assigned_object)) && (!is_array(assigned_object))) {
          return new_json;
        }

        if (is_array(assigned_object)) {
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
    clone : function(json_object) {
      return JSON.parse(JSON.stringify(json_object));
    },
    merge : function(base_object, default_object) {
      if (is_null_or_undefined(base_object)) {
        return JSON.parse(JSON.stringify(default_object));
      }
      var main_object = JSON.parse(JSON.stringify(base_object));
      for (var key in default_object) {
        var main_value = main_object[key];
        var default_value = default_object[key];
        if (is_null_or_undefined(main_value)) {
          main_object[key] = JSON.parse(JSON.stringify(default_value));
          continue;
        }
        
        // Type check
        var type_of_main_value = typeof main_value;
        var type_of_default_value = typeof default_value;
        if (type_of_main_value !== type_of_default_value) {
          //console.assert(false, "The types of main & default values are different. (main:'" + type_of_main_value + "', default:'" + type_of_default_value + "')");
          //console.assert(false, main_value);
          //console.assert(false, default_value);
          //main_object[key] = JSON.parse(JSON.stringify(default_value));
          continue;
        }
        
        // if object, merge recursively.
        if (is_object(main_value)) {
          main_object[key] = Utils.merge(main_value, default_value);
        }
      }
      return JSON.parse(JSON.stringify(main_object));
    },
    find : function(tree, id_key, branchs_key, ids) {
      console.assert(!is_null_or_undefined(tree), "[tree] is null or undefined.");
      console.assert(!is_null_or_undefined(id_key), "[id_key] is null or undefined.")
      console.assert(!is_null_or_undefined(branchs_key), "[branchs_key] is null or undefined.")
      console.assert(!is_null_or_undefined(ids), "[ids] is null or undefined.")
      
      if (ids.length === 0) {
        return null;
      }
      var id = tree[id_key]
      if (is_null_or_undefined(id)) {
        return null;
      }
      if (id !== ids[0]) {
        return null;
      }
      if (ids.length === 1) {
        return tree;
      }
      
      var branchs = tree[branchs_key];
      if (is_null_or_undefined(branchs)) {
        return null;
      }
      
      if (!is_array(branchs)) {
        console.assert(false, "branchs is not array.");
        return null;
      }
      
      var new_ids = ids.slice(1);
      for (var i = 0; i < branchs.length; i++) {
        var branch = branchs[i];
        if (is_null_or_undefined(branch)) {
          continue;
        }
        var leaf = Utils.find(branch, id_key, branchs_key, new_ids);
        if (leaf === null) {
          continue;
        }
        return leaf;
      }
      return null;
    }
  };
  
  return Utils;
});
