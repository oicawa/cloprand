define(function (require) {
  require('jquery');
  require('json2');
  var Utils = require("core/Utils");

  var _data = {};

  function convert(array_data) {
    var map_data = {};
    for (var i = 0; i < array_data.length; i++) {
      var data = array_data[i];
      map_data[data.uuid] = data;
    }
    return map_data;
  }

  Utils.get_data(Utils.PRIMITIVE_UUID, null, function (data) { _data[Utils.PRIMITIVE_UUID] = convert(data); })
  
  return {
  	get_data : function(class_id, object_id) {
      var map_data = _data[class_id];
      if (!map_data) {
        return null;
      }
      if (!object_id) {
        return map_data;
      }
      var data = map_data[object_id];
      if (!data) {
        return null;
      }
      return data;
  	}
  };
});
