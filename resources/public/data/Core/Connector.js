define(function (require) {
  require('jquery');
  require('json2');
  
  function send(method, url, data, files, data_type, on_succeeded, on_failed) {
    var dfd = new $.Deferred;
    var formData = new FormData();
    formData.append("value", encodeURIComponent(JSON.stringify(data)));
    if (files) {
      for (var key in files) {
        formData.append(key, files[key]);
      }
    }
    $.ajax({
      type: method,
      url: url,
      contentType: false,
      processData: false,
      dataType: data_type,
      cache: false,
      //data: { "value" : JSON.stringify(data) }
      data: formData
    }).done(function (response, status) {
      if (typeof on_succeeded == "function") {
        on_succeeded(response);
        dfd.resolve();
      } else {
        console.assert(false, "Function [on_succeeded] is not assigned.\n(" + url + ")");
        console.error("status=" + status);
        console.dir(response);
        dfd.reject();
      }
    }).fail(function (response, status) {
      console.dir(response);
      if (response.status == 401) {
        console.assert(false, "Unauthenticated");
        dfd.reject();
        location.href = "/login?next=/tames";
        return;
      }
      if (typeof on_failed != "function") {
        console.assert(false, "Function [on_failed] is not assigned.\n(" + url + ")");
        console.error("status=" + status);
        console.dir(response);
        dfd.reject();
        return;
      }
      if (!on_failed(response, status)) {
        dfd.reject();
      } else {
        dfd.resolve();
      }
    });
    return dfd.promise();
  }
  
  return {
    send : send,
    session: function(key, on_succeeded, on_failed) {
      var url = "/session/" + key;
      return send("GET", url, null, null, "json", on_succeeded, on_failed);
    },
    crud : {
      create : function(url, data, files, on_succeeded, on_failed) {
        return send("POST", url, data, files, "json", on_succeeded, on_failed);
      },
      read : function(url, data_type, on_succeeded, on_failed) {
        return send("GET", url, null, null, data_type, on_succeeded, on_failed);
      },
      update : function(url, data, files, on_succeeded, on_failed) {
        return send("PUT", url, data, files, "json", on_succeeded, on_failed);
      },
      delete : function(url, on_succeeded, on_failed) {
        return send("DELETE", url, null, null, "json", on_succeeded, on_failed);
      }
    },
  };
});
