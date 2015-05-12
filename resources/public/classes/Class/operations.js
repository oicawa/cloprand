define(function (require) {
  require("jquery");
  require("json2");
  //require("jquery_ui");
  require("jquery_splitter");
  require("jsrender");
  var Utils = require("core/Utils");
  var application = require("application");
  //var Toolbar = require("core/controls/Toolbar/Toolbar");
  //var Grid = require("core/controls/Grid/Grid");
  //var Detail = require("core/controls/Detail/Detail");
  function get_tab_id(li) {
    var tab = li.closest("div.tab-panel");
    return tab.attr("id");
  }
  function get_detail(li) {
    var tab_id = get_tab_id(li);
    return application.tabs().content(tab_id);
  }
  return {
    "edit_class" : function(event, li) {
      var detail = get_detail(li);
      detail.edit(true);
    },
    "delete_class" : function(event, li) {
      var res = confirm("Delete this class?");
      if (!res) {
        return;
      }
      var tab_id = get_tab_id(li);
      var detail = get_detail(li);
      var classes = null;
      Utils.delete_data("class", detail.data().uuid, function(response) { classes = response; })
      .then(function() {
        alert("Deleted");
        detail.commit();
        detail.edit(false);
        application.tabs().remove(tab_id);
        application.list().data(classes);
      });
    },
    "save_class" : function(event, li) {
      var detail = get_detail(li);
      var data = detail.data();
      var old_tab_id = get_tab_id(li);
      var new_tab_id = "class-" + data.name;
      var classes = null;
      if (detail.is_new()) {
        Utils.post_data("class", data, function(response) { classes = response; })
        .then(function() {
          alert("Saved");
          detail.commit();
          detail.edit(false);
          application.tabs().change(old_tab_id, new_tab_id, data.label);
          application.list().data(classes);
        });
      } else {
        Utils.put_data("class", data.uuid, data, function(response) { systems = response; })
        .then(function() {
          alert("Saved");
          detail.commit();
          detail.edit(false);
          application.tabs().change(old_tab_id, new_tab_id, data.label);
          application.list().data(systems);
        });
      }
    },
    "cancel_class" : function(event, li) {
      if (!confirm("Canceled?")) {
        return;
      }
      var detail = get_detail(li);
      detail.restore();
      detail.edit(false);
    }
  };
});
