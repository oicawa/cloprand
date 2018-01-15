define(function (require) {
  require('jquery');
  require('json2');
  
  function send(method, url, data, files, data_type) {
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
      ifModified: true,
      url: url,
      contentType: false,
      processData: false,
      dataType: data_type,
      cache: false,
      data: method == "GET" ? null : formData
    }).done(function (data, text_status, jqXHR) {
      dfd.resolve(data, text_status, jqXHR);
    }).fail(function (jqXHR, text_status, error_thrown) {
      if (jqXHR.status == 401) {
        dfd.reject(jqXHR, text_status, error_thrown);
        location.href = jqXHR.responseJSON.url;
        return;
      }
      dfd.reject(jqXHR, text_status, error_thrown);
    });
    return dfd.promise();
  }
  
  return {
    send : send,
    post : function(url, data, files, data_type) { 
      return send("POST", url, data, files, data_type);
    },
    get : function(url, data_type) {
      return send("GET", url, null, null, data_type);
    },
    update : function(url, data, files, data_type) {
      return send("PUT", url, data, files, data_type);
    },
    delete : function(url, data_type) {
      return send("DELETE", url, null, null, data_type);
    },
    session: function(key) {
      var url = "/session/" + key;
      return send("GET", url, null, null, "json");
    },
    pdf : function(data) { 
      return send("POST", "/pdf", data, null, "json");
    }
  };
});
