define(function (require) {
  require("jquery");
  //require("json2");
  //require("jquery_ui");
  require("jquery_splitter");
  require("jsrender");
  var Utils = require("core/Utils");
  //var Toolbar = require("core/controls/Toolbar/Toolbar");
  //var Grid = require("core/controls/Grid/Grid");
  //var Detail = require("core/controls/Detail/Detail");
  return {
    "init" : function() {
      //alert("Called systems operations init function.");
      // Layout
      $('#root-panel').css({width: '100%', height: '100%'}).split({orientation: 'horizontal', limit: 20, position: '45px', invisible: true, fixed: true});
      
      var systems = null;
      $.when(
        Utils.get_json("systems", "", "", function (data) { systems = data; })
        //Utils.get_template("", "", function (data) { template = $.templates(data); }),
        //Utils.get_json("config", "", "", function (data) { config = data; })
      ).always(function() {
        alert(systems);
        var content = $("#contents-panel");
        var ul = $("<ul></ul>");
        content.append(ul);
        for (var i = 0; i < systems.length; i++) {
          ul.append("<li>" + systems[i] + "</li>");
        }
      });
    }
  };
});
