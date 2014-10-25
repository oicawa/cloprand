cloprand.manager = {
  // Tab wrapper
  init : function(parent_tab_id) {
    var _tab = $('#' + parent_tab_id);
    //_tab.html('Management Page.');
    _tab.append("<div>" + "Management Page." + "</div>");
    return _tab;
  }
}
