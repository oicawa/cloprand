define(function (require) {
  require("jquery");
  require('json2');
  var Connector = require('core/Connector');

  var css_path_2_last_modified = {};
  
  function append(properties_list) {
    var dfd = new $.Deferred;
    
    var properties = properties_list.shift();
    if (is_null_or_undefined(properties)) {
      dfd.resolve();
      return dfd.promise();
    }
    
    var path = properties["path"];
    var time = properties["last-modified"];
    css_path_2_last_modified[path] = time;
    
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = path + "?" + time;
    link.onload = function() {
      append(properties_list)
      .then(function () {
        dfd.resolve();
      });
    };
    
    var head = $("head");
    head.append(link);
    
    return dfd.promise();
  }
  
  function exists (path) {
    var last_modified = css_path_2_last_modified[path];
    return is_null_or_undefined(last_modified) ? false : true;
  }
  
  function get_properties_list (paths) {
    var dfd = new $.Deferred;
    Connector.public_operate("resource", "properties-list", "json", paths)
    .done(function (properties_list) {
      dfd.resolve(properties_list);
    })
    .fail(function (jqXHR, text_status, error_thrown) {
      if (jqXHR.status == 410) {
        console.log("CSS file does not exist. (" + path + ")");
      }
      dfd.reject(null);
    });
    return dfd.promise();
  }

  var Css = {
    load: function(/* paths */) {
      var paths = Array.prototype.slice.call(arguments, 0);
      var targets = paths.filter(function (path) { return !exists(path); });
      var dfd = new $.Deferred;
      if (targets.length == 0) {
        dfd.resolve();
        return dfd.promise();
      }
      get_properties_list(paths)
      .then(function (properties_list) {
        return append(properties_list);
      })
      .then(function () {
        dfd.resolve();
      });
      dfd.resolve();
      return dfd.promise();
    }
  };
  
  return Css;
});
