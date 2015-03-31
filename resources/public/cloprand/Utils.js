define([
  'jquery'
], function (_) {
  return {
    get_data: function(url, func_success, func_error) {
      var dfd = new $.Deferred;
      $.ajax({
        url: url,
        cache: false,
        success: function (response, status) {
          if (typeof func_success == "function") {
            func_success(response);
            dfd.resolve();
          } else {
            alert("The success function is not assigned.\n(" + url + ")");
            dfd.reject();
          }
        },
        error: function (response, status) {
          if (typeof func_error == "function") {
            func_error(response, status);
          } else {
            alert("The error function is not assigned.\n(" + url + ")");
          }
          dfd.reject();
        }
      });
      return dfd.promise();
    },
    add_css: function(path) {
      var head = $("head");
      var css = head.children("link[href='" + path + "']");
      if (0 < css.length) {
        //console.log("[" +path + "]: already included (count=" + css.length + ")");
        return;
      }
      head.append("<link rel='stylesheet' type='text/css' href='" + path + "'></link>");
    }
  };
});
