define(function (require) {
  require("jquery");
  require("jsrender");
  var Utils = require("Utils");
  return function () {
    var icon_names = {
      "add": "ui-icon-plus",
      "delete": "ui-icon-minus",
      "edit": "ui-icon-pencil",
      "save": "ui-icon-disk",
      "cancel": "ui-icon-trash"
    };
  	var _root = null;
    var _actions = [];
    var _template = null;
    var _css = null;
    var _instance = this;

    function create_toolbar() {
      var root_html = _template.render({"actions":_actions});
      _root.append(root_html);

      for (var i = 0; i < _actions.length; i++) {
        var action = _actions[i];
        var icon = _root.find("ul > li > span." + action.icon_name);
        var li = icon.parent();
        if (action.caption && action.caption != "") {
          var caption = li.find("span.caption");
          caption.addClass("space");
        }
        li.on("click", action.func);
      }

      // Hover states on the static widgets
      _root.find("ul.toolbar > li").hover(
        function() { $(this).addClass("ui-state-hover"); },
        function() { $(this).removeClass("ui-state-hover"); }
      );
    }

    this.init = function(selector, actions) {
      // Set member fields
      _root = $(selector);
      _actions = actions;
      for (var i = 0; i < _actions.length; i++) {
        var action = _actions[i];
        action.icon_name = icon_names[action.name];
      }

      // Load template data & Create form tags
      Utils.add_css("Controls/Toolbar/Toolbar.css");
      $.when(
      	Utils.get_data("Controls/Toolbar/Toolbar.html", function(response) { _template = $.templates(response); })
      ).always(function() {
        create_toolbar();
      });
    };
  }; 
}); 
