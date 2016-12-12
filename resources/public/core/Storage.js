define(function (require) {
  require("jquery");
  require('json2');
  var Utils = require('core/Utils');
  var Connector = require('core/Connector');
  
  var storage = window.sessionStorage;
  storage.clear();
  
  function get_all(class_id) {
    var objects_string = storage.getItem(class_id);
    if (!objects_string) {
      return null;
    }
    var objects = JSON.parse(objects_string);
    if (!objects) {
      return null;
    }
    return objects;
  }
  
  function get_one(class_id, object_id) {
    var objects = get_all(class_id);
    if (!objects) {
      return null;
    }
    var object = objects[object_id];
    return !object ? null : object;
  }
  
  function set_all(class_id, objects) {
    console.assert(Utils.is_object(objects), objects);
    if (!Utils.is_object(objects)) {
      console.error("'objects' argument is not [Object].");
      console.dir(objects);
      return;
    }
    storage.setItem(class_id, JSON.stringify(objects));
  }
  
  function set_one(class_id, object_id, object) {
    console.assert(Utils.is_object(object), object);
    if (!Utils.is_object(object)) {
      console.error("'object' argument is not [Object].");
      console.dir(object);
      return;
    }
    var objects = get_all(class_id);
    if (!objects) {
      objects = {};
    }
    objects[object_id] = object;
    set_all(class_id, objects);
  }
  
  function remove_all(class_id) {
    storage.removeItem(class_id);
  }
  
  function remove_one(class_id, object_id) {
    var objects = get_all(class_id);
    if (!objects) {
      return;
    }
    delete objects[object_id];
    set_all(objects);
  }
  
  var Storage = {
    create: function(class_id, object, files) {
      var url = 'api/' + class_id;
      var dfd = new $.Deferred;
      Connector.post(url, object, files, "json")
      .done(function (response, text_status, jqXHR) {
        dfd.resolve(response, text_status, jqXHR);
      })
      .fail(function (jqXHR, text_status, error_thrown) {
        if (jqXHR.status == 410) {
          remove_all(class_id);
        }
        dfd.reject(jqXHR, text_status, error_thrown);
      });
      return dfd.promise();
    },
    read: function(class_id, object_id) {
      var url = 'api/' + class_id + (!object_id ? '' : '/' + object_id);
      var dfd = new $.Deferred;
      Connector.get(url, "json")
      .done(function (response, text_status, jqXHR) {
        var data = null;
        if (jqXHR.status == 304) {
          data = !object_id ? get_all(class_id) : get_one(class_id, object_id);
        } else {
          data = response;
        }
        if (!object_id) {
          set_all(class_id, data);
        } else {
          set_one(class_id, object_id, data);
        }
        dfd.resolve(data);
      })
      .fail(function (jqXHR, text_status, error_thrown) {
        if (jqXHR.status == 410) {
          if (!object_id) {
            remove_all(class_id);
          } else {
            remove_one(class_id, object_id);
          }
        }
        dfd.reject(jqXHR, text_status, error_thrown);
      });
      return dfd.promise();
    },
    update: function(class_id, object_id, object, files) {
      var url = 'api/' + class_id + '/' + object_id;
      var dfd = new $.Deferred;
      Connector.update(url, object, files, "json")
      .done(function (response, text_status, jqXHR) {
        dfd.resolve(response, text_status, jqXHR);
      })
      .fail(function (jqXHR, text_status, error_thrown) {
        if (jqXHR.status == 410) {
          remove_one(class_id, object_id);
        }
        dfd.reject(jqXHR, text_status, error_thrown);
      });
      return dfd.promise();
    },
    delete: function(class_id, object_id) {
      var url = 'api/' + class_id + '/' + object_id;
      var dfd = new $.Deferred;
      Connector.delete(url, "json")
      .done(function (response, text_status, jqXHR) {
        remove_one(class_id, object_id);
        dfd.resolve(response, text_status, jqXHR);
      })
      .fail(function (jqXHR, text_status, error_thrown) {
        if (jqXHR.status == 410) {
          remove_one(class_id, object_id);
        }
        dfd.reject(jqXHR, text_status, error_thrown);
      });
      return dfd.promise();
    }
  };
  
  return Storage;
});
