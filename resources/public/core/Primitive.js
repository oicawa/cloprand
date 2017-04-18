define(function (require) {
  require('jquery');
  require('json2');
  var Utils = require('core/Utils');
  var Storage = require('core/Storage');
  var Class = require('core/Class');

  function get_controls() {
    return Storage.read(Class.PRIMITIVE_ID)
    .done(function (primitives) {
      var controls = {};
      var dfd = new $.Deferred;
      var promises = Object.keys(primitives).map(function(object_id) {
        var primitive = primitives[object_id];
        var inner_dfd = new $.Deferred;
        require([primitive.require_path], function(Control) {
          controls[primitive.id] = Control;
          inner_dfd.resolve();
        });
        return inner_dfd.promise();
      });
      $.when.apply(null, promises)
      .then(function() {
        dfd.resolve(controls);
      });
      return dfd.promise();
    });
  }
    
  var Primitive = {
    controls : get_controls()
  }
  
  return Primitive;
});
