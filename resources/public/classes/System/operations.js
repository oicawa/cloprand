define(function (require) {
  require("jquery");
  require("json2");
  //require("jquery_ui");
  require("jquery_splitter");
  require("jsrender");
  var Utils = require("core/Utils");
  //var Toolbar = require("core/controls/Toolbar/Toolbar");
  //var Grid = require("core/controls/Grid/Grid");
  //var Detail = require("core/controls/Detail/Detail");
  return {
    "edit_system" : function(event, parent) {
      parent.edit(true);
    },
    "delete_system" : function(event, parent) {
      var res = confirm("Delete this system?");
      alert(res);
    },
    "save_system" : function(event, parent) {
      var systems = null;
      Utils.post_data("", "", "systems", parent.data(), function(response) { systems = response; })
      .then(function() {
        alert("Saved");
        parent.commit();
        parent.edit(false);
      });
    },
    "cancel_system" : function(event, parent) {
      alert("Canceled.");
      parent.edit(false);
    }
  };
});
