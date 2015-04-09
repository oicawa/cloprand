define(function (require) {
  require("jquery");
  require("jsrender");
  var Utils = require("core/Utils");
  return function () {
    var icon_names = {
      "add": "ui-icon-plus",
      "delete": "ui-icon-minus",
      "edit": "ui-icon-pencil",
      "save": "ui-icon-disk",
      "cancel": "ui-icon-trash"
    };
  	var _root = null;
    var _settings = null;
    var _template = null;
    var _css = null;
    var _instance = this;

    function create_toolbar() {
      var root_html = _template.render(_settings);
      _root.append(root_html);
      require([ _settings.operations ], function(operations) {
        for (var i = 0; i < _settings.items.length; i++) {
          var item = _settings.items[i];
          var icon = _root.find("ul > li > span." + item.icon_name);
          var li = icon.parent();
          if (item.caption && item.caption != "") {
            var caption = li.find("span.caption");
            caption.addClass("space");
          }
          li.on("click", operations[item.operation]);
        }
      });

      // Hover states on the static widgets
      _root.find("ul.toolbar > li").hover(
        function() { $(this).addClass("ui-state-hover"); },
        function() { $(this).removeClass("ui-state-hover"); }
      );
    }

    this.init = function(selector, settings) {
      // Set member fields
      _root = $(selector);
      _settings = settings;
      for (var i = 0; i < _settings.items.length; i++) {
        var item = _settings.items[i];
        item.icon_name = icon_names[item.name];
      }

      // Load template data & Create form tags
      Utils.add_css("/controls/Toolbar/Toolbar.css");
      $.when(
      	Utils.get_control_template("Toolbar", function(response) { _template = $.templates(response); })
      ).always(function() {
        create_toolbar();
      });
    };
  }; 
}); 
