cloprand.widgets = {
  // Tab wrapper
  tabs : function(tabs_id) {
    var _tabs = $('#' + tabs_id).tabs();

	// Add a click event to [x] icon
    $("#" + tabs_id).on("click", "span.ui-icon-close", function() {
      var panelId = $(this).closest("li").remove().attr("aria-controls");
      $("#" + panelId).remove();
      _tabs.tabs("refresh");
    });
    
    return {
      add : function(tab_id, title, options) {
        var tabTemplate = "<li><a href='#{href}'>#{label}</a> <span class='ui-icon ui-icon-close'>Remove Tab</span></li>";
        var li = $(tabTemplate.replace(/#\{href\}/g, "#" + tab_id).replace(/#\{label\}/g, title));
        _tabs.find(".ui-tabs-nav").append(li);
        _tabs.append("<div id='" + tab_id + "'><p>" + options.contents + "</p></div>" );
        _tabs.tabs("refresh");
      },
      exists : function(tab_id) {
        var tabArray = _tabs.find("#" + tab_id);
        return tabArray.length == 0 ? false : true;
      },
      select : function(tab_id) {
        var index = _tabs.index("ul > li > a[href='#" + tab_id + "']");
        _tabs.tabs({ active : index});
        _tabs.tabs("refresh");
      },
      remove : function(tab_id) {
      },
    }
  }
}
