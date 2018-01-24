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

  function convert_pdf_field(properties, data) {
    return {
      "type" : "text",
      "text" : Locale.translate(data[properties.field.field_name]),
      "font" : properties.font,
      "font_size" : parseFloat(properties.font_size),
      "x" : parseFloat(properties.x),
      "y" : parseFloat(properties.y)
    };
  }
  
  function convert_pdf_line(properties) {
    return {
      "type" : "line",
      "x1" : parseInt(properties.x1),
      "y1" : parseInt(properties.y1),
      "x2" : parseInt(properties.x2),
      "y2" : parseInt(properties.y2)
    };
  }
  
  function convert_pdf_phrase(properties) {
    return {
      "type" : "phrase",
      "text" : properties.text
    };
  }

  var Pdf = {
    "create" : function (event) {
      var item = event.item;
      var entry = item.function_entry;
      var view = item.context;
      var detail = view.detail();
      var data = detail.data();
      
      var print_objects = entry.properties.pdf_objects.map(function (pdf_object) {
        var type_id = pdf_object.type.id;
        var properties = pdf_object.type.properties;
        var print_object = null;
        if (type_id == "fe5cd94a-93c6-41eb-a16f-6628a915f05a") {
          print_object = Utils.clone(properties);
          print_object.type = "text";
          print_object.font_size = parseFloat(print_object.font_size);
          print_object.x = parseFloat(print_object.x);
          print_object.y = parseFloat(print_object.y);
        } else if (type_id == "778cb434-c527-4350-911d-59902ee7aa45") {
          print_object = convert_pdf_field(properties, data);
        } else if (type_id == "9ca65e40-bd09-46c2-955a-e19e07be9a17") {
          print_object = convert_pdf_line(properties);
        } else if (type_id == "bff15667-03ad-40be-aa21-c556ae35ce7b") {
          print_object = convert_pdf_phrase(properties);
        }
        return print_object;
      });
      var pdf_data = Utils.clone(entry.properties);
      pdf_data.pdf_objects = print_objects;
      Connector.pdf(pdf_data);
    }
  };

  return Pdf;
});
