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

  var Pdf = {
    "create" : function (event) {
      var ids = event.target.split(":");
      var item = Utils.find(event.item, "id", "items", ids);
      var entry = item.function_entry;
      var view = item.context;
      var detail = view.detail();
      var data = detail.data();
      var types = null;
      var directions = null;

      function convert_pdf_params(type, properties) {
        var pdf_params = Utils.clone(properties);
        if (!is_null_or_undefined(properties.cells)) {
          var cells = properties.cells.map(function(cell) {
            var type_id = cell.type.id;
            var _type = types[type_id];
            return convert_pdf_params(_type, cell.type.properties);
          });
          pdf_params.cells = cells;
        }
        // Convert from field information to the real value.
        if (!is_null_or_undefined(properties.field)) {
          delete pdf_params["field"];
          var text = Locale.translate(data[properties.field.field_name]);
          console.assert(!is_null_or_undefined(text), "field '" + properties.field.field_name + "' does not exist in the context dadta.");
          pdf_params.text = text;
        }
        if (!is_null_or_undefined(properties.direction)) {
          var direction_id = properties.direction;
          var direction = (direction_id === null || direction_id === "") ? "horizontal" : directions[direction_id].direction;
          pdf_params.direction = direction;
        }
        pdf_params.output_type = type.output_type;
        return pdf_params;
      }
      
      $.when(
        Storage.read("77859951-f98d-4740-b151-91c57fe77533").done(function (response) { types = response; }),
        Storage.read("a16ad3e9-021a-49fe-b4be-9a368a0aa15f").done(function (response) { directions = response; })
      ).then(function () {
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
