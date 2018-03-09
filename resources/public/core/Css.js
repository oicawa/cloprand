define(function (require) {
  require("jquery");
  require('json2');
  var Connector = require('core/Connector');
  
  function append(path, time) {
    var date = new Date(time);
    var dfd = new $.Deferred;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = "resources/" + path + "?" + time;
    link.onload = function() {
      dfd.resolve();
    };
    
    var head = $("head");
    head.append(link);
    
    return dfd.promise();
  }
  
  function exists (path) {
    var head = $("head");
    var all_css_list = head.children("link[type='text/css']");
    
    var css_list = [];
    for (var i = 0; i < all_css_list.length; i++) {
      var css = all_css_list[i];
      if (css.href.startsWith("resources/" + path)) {
        css_list.push[css];
      }
    }
    
    return css_list.length == 0 ? false : true;
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
