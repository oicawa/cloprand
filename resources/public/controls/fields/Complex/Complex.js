define(function (require) { 
  require("jquery");
  require("jsrender");
  var Utils = require("core/Utils");
  var Detail = require("controls/Detail/Detail");

  function Complex() {
    this._detail = null;
  };
  
  Complex.prototype.init = function(selector, field, assist) {
    var dfd = new $.Deferred;
    var root = $(selector);
    if (0 < root.children()) {
      dfd.resolve();
      return dfd.promise();
    }

    // Load template data & Create form tags
    var template = null;
    var class_ = null;
    var self = this;
    $.when(
      Utils.get_template("controls/fields", "Complex", function(response) { template = $.templates(response); }),
      Utils.get_data(Utils.CLASS_UUID, field.datatype.class, function (data) { class_ = data; })
    ).always(function() {
      var html = template.render();
      root.append(html);
      // Create controls
      self._detail = new Detail();

      $.when(
        self._detail.init(selector + " > div.complex > div.detail", class_)
      ).always(function() {
        self._detail.visible(true);
        self._detail.edit(false);
        dfd.resolve();
      });
    });
    return dfd.promise();
  };

  Complex.prototype.backuped = function() {
    return this._backuped;
  };

  Complex.prototype.commit = function() {
    this._backuped = this._detail.data();
    this._detail.commit();
  };

  Complex.prototype.restore = function() {
    this._detail.data(this._backuped);
  };

  Complex.prototype.edit = function(on) {
    this._detail.edit(on);
  };

  Complex.prototype.data = function(values) {
    if (arguments.length == 0) {
      return this._detail.data();
    } else {
      this._detail.data(values);
    }
  };
  
  return Complex;
}); 
