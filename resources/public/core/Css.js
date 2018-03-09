define(function (require) {
  require("jquery");
  require('json2');
  var Connector = require('core/Connector');

  var css_path_2_last_modified = {};
  
  function append(path, time) {
    css_path_2_last_modified[path] = time;
    var date = new Date(time);
    var dfd = new $.Deferred;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = path + "?" + time;
    link.onload = function() {
      dfd.resolve();
    };
    
    var head = $("head");
    head.append(link);
    
    return dfd.promise();
  }
  
  function exists (path) {
    var last_modified = css_path_2_last_modified[path];
    return is_null_or_undefined(last_modified) ? false : true;
  }
  
  function get_last_modified (path) {
    var dfd = new $.Deferred;
    Connector.operate("resource", "properties", "json", path)
    .done(function (properties) {
      var last_modified = properties["last-modified"]
      dfd.resolve(last_modified);
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
    load: function(path) {
      var dfd = new $.Deferred;
      if (exists(path)) {
        dfd.resolve();
        return dfd.promise();
      }
      
      get_last_modified(path)
      .then(function (last_modified) {
        return append(path, last_modified);
      })
      .then(function () {
        dfd.resolve();
      });
      return dfd.promise();
    }
  };
  
  return Css;
});
