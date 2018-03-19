define(function (require) {
  require('jquery');
  var Utils = require('core/Utils');
  var Storage = require('core/Storage');

  var Primitive = {};

  Primitive.ID = "1fd7625f-78b5-4079-95dd-951186cb79fe";

  Primitive.controls = function () {
    var dfd = new $.Deferred;
    Storage.read(Primitive.ID)
    .done(function (primitives) {
      var controls = {};
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
    });
    return dfd.promise();
  }

  return Primitive;
});
