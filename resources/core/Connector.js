define(function () {
  function send(method, url, data, files, data_type) {
    var dfd = new $.Deferred;
    
    // Form data
    var formData = new FormData();
    formData.append("value", encodeURIComponent(JSON.stringify(data)));
    if (files) {
      for (var key in files) {
        formData.append(key, files[key]);
      }
    }
    
    // XMLHttpRequest
    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.responseType = data_type;
    //xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      if (xhr.status != 401) {
        dfd.resolve(this.response, this.statusText, xhr);
        return;
      }
      var redirect = !url.startsWith("/api/session/identity");
      if (redirect) {
        location.href = "/tames";
      } else {
        dfd.reject(xhr, this.statusText);
      }
    };
    xhr.onerror = function () {
        dfd.reject(xhr, this.statusText);
    };
    xhr.send(method === "GET" ? null : formData);
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
    public_operate : function(operator_name, operation_name, data_type, data) {
      var url = '/public_api/operation/' + operator_name + '/' + operation_name;
      return send("POST", url, data, null, data_type);
    },
    generate : function(generator_name, content_type, data) {
      send('POST', '/api/generate/' + generator_name, data, null, 'arraybuffer')
      .done(function (response) {
        var blob = new Blob([response], {type: content_type});
        var file_url = window.URL.createObjectURL(blob);
        try {
          window.open(file_url, '_blank');
        } catch (e) {
          var file_name = fileURL.split(/:/)[1];
          window.navigator.msSaveOrOpenBlob(blob, file_name);
        }
      });
    },
    pdf : function(data) {
      Connector.generate("pdf", "application/pdf", data);
    }
  };
  return Connector;
});
