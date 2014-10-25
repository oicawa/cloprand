var app = {
  select_menu : function(tab_id) {
    var tabs = cloprand.widgets.tabs('tabs');
    if (tabs.exists(tab_id)) {
      tabs.select(tab_id);
      return;
     }
    cloprand.post(
      "get_tabcontents",
      { "tab_id": tab_id },
      null,
      function(response_data) {
        tabs.add(tab_id, response_data.label, { base : "cloprand/list.html", contents : "" });
        tabs.select(tab_id);
        cloprand.load_script("cloprand." + tab_id + "/core.js", function() {
          cloprand[tab_id].init(tab_id, null);
         });
       },
      null);
  },

  init : function(){
    $("#tabs").tabs({ heightStyle : 'fill' });
    $("#home").append("<div class='menu_button' id='management_button'>管理</div>");
    $("#home").append("<div class='menu_button' id='dummy_menu_button'>ダミー</div>");

    $("#management_button").click(function() { app.select_menu('management'); });
    $("#dummy_menu_button").click(function() { app.select_menu('dummy_menu'); });
  },
};

