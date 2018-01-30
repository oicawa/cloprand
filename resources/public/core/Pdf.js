define(function (require) {
  require("jquery");
  var app = require("app");
  var Utils = require("core/Utils");
  var Uuid = require("core/Uuid");
  var Class = require("core/Class");
  var Storage = require("core/Storage");
  var Connector = require("core/Connector");
  var Contents = require("core/Contents");
  var Locale = require("core/Locale");
  var Toolbar = require("core/Control/Toolbar");
  var Detail = require("core/Control/Detail");
  var Tabs = require("core/Control/Tabs");
  var Menu = require("core/Control/Menu");
  var Dialog = require("core/Dialog");
  var Action = require("core/Action");

  function convert_pdf_params(type, properties, data) {
    var pdf_params = Utils.clone(properties);
    // Convert from field information to the real value.
    if (!is_null_or_undefined(properties.field)) {
      delete pdf_params["field"];
      pdf_params.text = Locale.translate(data[properties.field.field_name]);
    }
    pdf_params.output_type = type.output_type;
    return pdf_params;
  }
  
  var Pdf = {
    "create" : function (event) {
      var ids = event.target.split(":");
      var item = Utils.find(event.item, "id", "items", ids);
      var entry = item.function_entry;
      var view = item.context;
      var detail = view.detail();
      var data = detail.data();
      var types = null;
      
      Storage.read("77859951-f98d-4740-b151-91c57fe77533")
      .then(function (response) {
        types = response;
      }).then(function () {
        var print_objects = entry.properties.pdf_objects.map(function (pdf_object) {
          var type_id = pdf_object.type.id;
          var type = types[type_id];
          var properties = pdf_object.type.properties;
          return convert_pdf_params(type, properties, data);
        });
        var pdf_data = Utils.clone(entry.properties);
        pdf_data.pdf_objects = print_objects;
        Connector.pdf(pdf_data);
      });
    }
  };

  return Pdf;
});
