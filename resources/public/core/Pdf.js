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
      var report_layouts = null;

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
          pdf_params.text = data[properties.field.field_name];
        }
        
        // Text
        if (!is_null_or_undefined(pdf_params.text)) {
          pdf_params.text = Locale.translate(pdf_params.text);
        }
        
        pdf_params.output_type = type.output_type;
        return pdf_params;
      }

      $.when(
        Storage.read("77859951-f98d-4740-b151-91c57fe77533").done(function (response) { types = response; }),
        Storage.read("c20afefc-1b66-41ee-8827-62983918206c").done(function (response) { report_layouts = response; })
      ).then(function () {
        var report_layout = report_layouts[entry.properties.report_layout];
        var print_objects = report_layout.pdf_objects.map(function (pdf_object) {
          var type_id = pdf_object.type.id;
          var type = types[type_id];
          var properties = pdf_object.type.properties;
          return convert_pdf_params(type, properties, data);
        });
        var pdf_data = {
          "title" : Locale.translate(report_layout.label),
          "pdf_objects" : print_objects
        };
        Connector.pdf(pdf_data);
      });
    }
  };

  return Pdf;
});
