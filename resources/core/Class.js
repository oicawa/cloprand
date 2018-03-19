define(function (require) {
  require('jquery');
  var Utils = require('core/Utils');
  var Locale = require('core/Locale');
  var Storage = require('core/Storage');
  var Uuid = require('core/Uuid');
  var Primitive = require('core/Primitive');
  
  function Class(_class) {
    this._class = _class;
  }
  
  Class.CLASS_ID = "a7b6a9e1-c95c-4e75-8f3d-f5558a264b35";
  Class.SYSTEM_ID = "15ab1b06-3756-48df-b045-728499aa9a6c";
  Class.FIELD_ID = "d2992e38-6190-4ca4-94bf-db44328dfd37";
  Class.WEBFONTS_SETS_ID = "43a28dff-bc30-452e-b748-08235443b7ce";
  Class.LOCALE_ID = "917b793a-c1a9-4736-84ff-3e10c6e4a95f";
  Class.TEXT_MULTILINGUALIZATION_ID = "f4ce98bf-27f9-4319-a112-95e529bc9ff9";
  Class.TEXTLINES_MULTILINGUALIZATION_ID = "48a93daf-9829-4bb8-9760-152491ed7a72";
  Class.FUNCTION_ENTRY_ID = "f447764e-45fe-425e-9b2b-6ae5e7760b2f";
  Class.MENU_ITEM_TYPE_ID = "c4e3e6d0-3d4d-439c-9fea-361f0afed10e";
  Class.VIEW_ID = "afb017dd-1ec8-4dfb-8e0c-df77a4925461";
  Class.COMPLEX_TYPE_ID = "eb05e181-7ef0-4355-898f-6381f8c867a9";

  Class.prototype.caption_fields = function() {
    return this._class.object_fields.filter(function (field) { return !(!field.caption); })
  };
  
  Class.prototype.captions = function(objects) {
    var fields = this.caption_fields();
    var captions = objects
      .map(function(object) {
         if (!object) {
           return "";
         }
         return fields
           .map(function(field) {
             var value = object[field.name];
             if (!is_object(value)) {
               return value;
             }
             
             if (!field.datatype.properties.multi_lingualization) {
               return value;
             }
             return Locale.translate(value);
           })
           .join(" ");
      });
    return captions;
  };
  
  Class.prototype.renderer = function() {
    var dfd = new $.Deferred;
    var self = this;
    
    var targets = this.caption_fields().map(function (field) {
      return {
        field : field,
        renderer : null
      };
    });
    var promises = [];
    Primitive.controls()
    .done(function (controls) {
      targets.forEach(function (target, index) {
        var inner_dfd = new $.Deferred;
        var pre_renderer = controls[target.field.datatype.id].renderer;
        if (!pre_renderer) {
          inner_dfd.resolve();
          promises[index] = inner_dfd.promise();
          return;
        }
        pre_renderer(target.field)
        .done(function (renderer) {
          targets[index].renderer = renderer;
          inner_dfd.resolve();
        });
        promises[index] = inner_dfd.promise();
      });
    })
    .then(function () {
      $.when.apply(null, promises)
      .then(function () {
        var renderer = function(object) {
          var captions = targets.map(function (target) {
            if (!target.renderer) {
              return object[target.field.name];
            }
            return target.renderer(object);
          });
          return captions.join(" ");
        };
        dfd.resolve(renderer);
      });
    });
    return dfd.promise();
  };
  
  Class.field_map = function(class_) {
    console.assert(class_.object_fields, "class_.object_fields is false/null/undefined");
    function compare_recid(rec1, rec2) {
      if (rec1.recid == rec2.recid) {
        return 0;
      }
      return rec1.recid < rec2.recid ? -1 : 1;
    }
    function generate_operator(field, generator_name, control) {
      console.assert(control, "'control' argument is null or undefined...");
      var dfd = new $.Deferred;
      var generator = control[generator_name];
      if (!generator) {
        dfd.resolve(null);
        return dfd.promise();
      }
      generator(field)
      .done(function (operator) {
        dfd.resolve(operator);
      });
      return dfd.promise();
    }

    function generate_operators(field, controls) {
      var value = { field : field };
      var dfd = new $.Deferred;
      var control = controls[field.datatype.id];
      if (!control) {
        dfd.resolve(value);
        return dfd.promise();
      }
      $.when(
       generate_operator(field, "renderer", control).done(function (render) { value.render = render; }),
       generate_operator(field, "comparer", control).done(function (compare) { value.compare = compare; })
      )
      .then(function () {
        dfd.resolve(value);
      });
      return dfd.promise();
    }
    
    var dfd = new $.Deferred;
    var promises = [];

    Primitive.controls()
    .done(function (controls) {
      class_.object_fields.forEach(function (field, index) {
        promises[index] = generate_operators(field, controls);
      });
    })
    .then(function () {
      $.when.apply(null, promises)
      .then(function () {
        var field_map = {};
        for (var i = 0; i < arguments.length; i++) {
          var value = arguments[i];
          field_map[value.field.name] = value;
        }
        field_map["recid"] = { compare: compare_recid }
        dfd.resolve(field_map);
      });
    });
    return dfd.promise();
  };

  Class.comparer = function(field_map) {
    var compares = Object.values(field_map).filter(function (field) {
      return is_null_or_undefined(field.compare) ? false : true;
    }).sort(function (field0, field1) {
      if (is_null_or_undefined(field0.field)) {
        return -1;
      }
      if (is_null_or_undefined(field1.field)) {
        return 1;
      }
      return field0.field.recid - field1.field.recid;
    }).map(function (field) {
      return field.compare;
    }).reverse();

    var comparer = function (item0, item1) {
      for (var i = 0; i < compares.length; i++) {
        var result = compares[i](item0, item1);
        if (result != 0) {
          return result;
        }
      }
      return 0;
    };
    
    return comparer;
  };

  Class.prototype.detail_actions = function() {
    return get_actions(this, "detail_actions");
  };

  Class.prototype.list_actions = function() {
    return get_actions(this, "list_actions");
  };

  return Class;
});
