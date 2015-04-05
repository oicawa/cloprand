define([
  'jquery'
], function (_) {
  function get_function(url, dataType, func_success, func_error) {
    var dfd = new $.Deferred;
    $.ajax({
      type: "GET",
      url: url,
      dataType: dataType,
      cache: false,
      //contentType: "application/json",
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
  }
  return {
    get_template: function(system_name, application_name, func_success, func_error) {
      var url = "/api/template?system_name=" + system_name + "&application_name=" + application_name;
      return get_function(url, "html", func_success, func_error);
    },
    get_json: function(api_name, system_name, application_name, func_success, func_error) {
      var url = "/api/" + api_name + "?system_name=" + system_name + "&application_name=" + application_name;
      return get_function(url, "json", func_success, func_error);
    },
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
    },
    get_system_name : function() {
      var path = location.pathname;
      var fields = path.split("/");
      if (fields.length <= 1) {
        return null;
      }
      var res = /^[A-Za-z_]\w*$/.test(fields[1]);
      if (!res) {
        return null;
      }
      return fields[1];
    },
    get_application_name : function() {
      var path = location.pathname;
      var fields = path.split("/");
      if (fields.length <= 2) {
        return null;
      }
      var res = /^[A-Za-z_]\w*$/.test(fields[2]);
      if (!res) {
        return null;
      }
      return fields[2];
    }
  };
});
