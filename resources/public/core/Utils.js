define(function (require) {
  require('jquery');
  require('json2');
  var _UUID = /[\w]{8}-[\w]{4}-[\w]{4}-[\w]{4}-[\w]{12}/;
  var _NULL_UUID = "00000000-0000-0000-0000-000000000000";
  var _CLASS_ID = "Class";
  var _PRIMITIVE_ID = "Primitive";
  function create_path() {
    var args = Array.prototype.slice.call(arguments);
    var result = args.every(function(arg) { return arg == null || typeof arg == "string"; });
    console.assert(result, args);
    var path = args.reduce(function (prev, current, index, array) {
      var adding = (current == null || current.length == 0) ? "" : "/" + current;
      return (prev == null ? "" : prev) + adding;
    });
    return path.substr(0, 1) == "/" ? path : "/" + path;
  }
  function send_function(method, url, dataType, data, func_success, func_error) {
    var dfd = new $.Deferred;
    console.assert(url != "/api", url);
    $.ajax({
      type: method,
      url: url,
      dataType: dataType,
      cache: false,
      data: { "value" : JSON.stringify(data) }
    }).done(function (response, status) {
      if (typeof func_success == "function") {
        func_success(response);
        dfd.resolve();
      } else {
        alert("The success function is not assigned.\n(" + url + ")\n\nresponse:" + JSON.stringify(response) + "\nstatus:" + status);
        dfd.reject();
      }
    }).fail(function (response, status) {
      if (typeof func_error != "function") {
        alert("The error function is not assigned.\n(" + url + ")\n\nresponse:" + JSON.stringify(response) + "\nstatus:" + status);
        dfd.reject();
        return;
      }
      if (!func_error(response, status)) {
        dfd.reject();
      } else {
        dfd.resolve();
      }
    });
    return dfd.promise();
  }
  function get_function(url, dataType, func_success, func_error) {
    return send_function("GET", url, dataType, null, func_success, func_error);
  }
  function post_function(url, dataType, data, func_success, func_error) {
    return send_function("POST", url, dataType, data, func_success, func_error);
  }
  function put_function(url, dataType, data, func_success, func_error) {
    return send_function("PUT", url, dataType, data, func_success, func_error);
  }
  function delete_function(url, dataType, func_success, func_error) {
    return send_function("DELETE", url, dataType, null, func_success, func_error);
  }
  return {
  	UUID : _UUID,
  	NULL_UUID : _NULL_UUID,
  	CLASS_ID : _CLASS_ID,
  	PRIMITIVE_ID : _PRIMITIVE_ID,
    get_extension: function(class_id, object_id, file_name, func_success, func_error) {
      var url = create_path(class_id, object_id, "extension", file_name);
      return get_function(url, "json", func_success, func_error);
    },
    post_extension: function(class_id, object_id, file_name, data, func_success, func_error) {
      var url = create_path(class_id, object_id, "extension", file_name);
      return post_function(url, "json", data, func_success, func_error);
    },
    put_extension: function(class_id, object_id, file_name, data, func_success, func_error) {
      var url = create_path(class_id, object_id, "extension", file_name);
      return put_function(url, "json", data, func_success, func_error);
    },
    delete_extension: function(class_id, object_id, file_name, func_success, func_error) {
      var url = create_path(class_id, object_id, "extension", file_name);
      return delete_function(url, "json", func_success, func_error);
    },
    get_file: function(class_id, file_name, data_type, func_success, func_error) {
      var url = create_path(class_id, file_name);
      //console.log(url);
      return get_function(url, data_type, func_success, func_error);
    },
    get_template: function(namespace, control_name, func_success, func_error) {
      var url = create_path(namespace, control_name, control_name + ".html");
      //console.log(url);
      return get_function(url, "html", func_success, func_error);
    },
    get_data: function(class_id, object_id, func_success, func_error) {
      var url = create_path("api", class_id, object_id);
      return get_function(url, "json", func_success, func_error);
    },
    post_data: function(class_id, data, func_success, func_error) {
      var url = create_path("api", class_id);
      return post_function(url, "json", data, func_success, func_error);
    },
    put_data: function(class_id, object_id, data, func_success, func_error) {
      var url = create_path("api", class_id, object_id);
      return put_function(url, "json", data, func_success, func_error);
    },
    delete_data: function(class_id, object_id, func_success, func_error) {
      var url = create_path("api", class_id, object_id);
      return delete_function(url, "json", func_success, func_error);
    },
    add_css: function(path) {
      var head = $("head");
      var css = head.children("link[href='" + path + "']");
      if (0 < css.length) {
        //console.log("[" +path + "]: already included (count=" + css.length + ")");
        return;
      }
      head.append("<link rel='stylesheet' type='text/css' href='" + path + "?_=" + (new Date()).getTime() + "'></link>");
      //head.append("<link rel='stylesheet' type='text/css' href='" + path + "' />");
    },
    get_class_id : function() {
      var path = location.pathname;
      var fields = path.split("/");
      if (fields.length <= 1) {
        return null;
      }
      var res = _UUID.test(fields[1]);
      if (!res) {
        return null;
      }
      return fields[1];
    },
    get_object_id : function() {
      var path = location.pathname;
      var fields = path.split("/");
      if (fields.length <= 2) {
        return null;
      }
      var res = _UUID.test(fields[2]);
      if (!res) {
        return null;
      }
      return fields[2];
    },
    property_value : function(instance, property, method_name, value) {
      if (value.length == 0) {
        return property[method_name]();
      } else if (value.length == 1) {
        property[method_name](value[0]);
        return instance;
      } else {
        console.assert(false, arguments);
      }
    },
  };
});
