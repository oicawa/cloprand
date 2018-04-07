define(function () {
  function clean_response(response, data_type) {
    if (data_type !== "json") {
      return response;
    }
    if (navigator.userAgent.indexOf('Trident') < 0) {
      return response;
    }
    return JSON.parse(response);
  }
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
      var response = clean_response(this.response, data_type);
      if (xhr.status != 401) {
        dfd.resolve(response, this.statusText, xhr);
        return;
      }
      var redirect = !url.startsWith("/api/session/identity");
      if (redirect) {
        location.href = response.redirect_url;
      } else {
        dfd.reject(response, xhr, this.statusText);
      }
    };
    xhr.onerror = function () {
      var response = clean_response(this.response, data_type);
      dfd.reject(response, this.statusText, xhr);
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
    },
    properties_list : function(paths) {
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
    },
    resource : function(path, data_type) {
      var dfd = new $.Deferred;
      Connector.properties_list([path])
      .done(function (properties_list) {
        var properties = (properties_list.length === 0) ? null : properties_list[0];
        var time = (properties === null) ? Date.now() : properties["last-modified"];
        var url = path + "?" + time;
        return Connector.get(url, data_type).done(function (data) { return dfd.resolve(data); });
      });
      return dfd.promise();
    },
    base_url : function () {
      var url = location.href;
      var index = url.indexOf("?");
      if (index < 0) {
        return url;
      }
      return url.substring(0, index);
    }
  };
  return Connector;
});
