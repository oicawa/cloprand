define(function (require) {
  //require('jquery');
  //require('json2');
  
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
      if (jqXHR.status != 401) {
        console.log("jqXHR.status != 401");
        dfd.reject(jqXHR, text_status, error_thrown);
        return;
      }
      var redirect = !url.startsWith("/api/session/identity");
      if (redirect) {
        console.log("location.href = '/tames'");
        location.href = "/tames";
      } else {
        console.log("Show Login Page.");
        dfd.reject(jqXHR, text_status, error_thrown);
      }
    });
    return dfd.promise();
  }
  
  var Connector = {
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
      var url = "/api/session/" + key;
      return send("GET", url, null, null, "json");
    },
    operate : function(operator_name, operation_name, data_type, data) {
      var url = '/api/operation/' + operator_name + '/' + operation_name;
      return send("POST", url, data, null, data_type);
    },
    generate : function(generator_name, content_type, data) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/generate/' + generator_name);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function() {
        var blob = new Blob([this.response], {type: content_type});
        var pdfURL = window.URL.createObjectURL(blob);
        window.open(pdfURL, '_blank');
      };
      var formData = new FormData();
      formData.append("value", encodeURIComponent(JSON.stringify(data)));
      xhr.send(formData);
    },
    pdf : function(data) {
      Connector.generate("pdf", "application/pdf", data);
    }
  };
  return Connector;
});
