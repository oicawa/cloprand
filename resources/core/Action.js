define(function (require) {
  require('jquery');
  var Class = require('core/Class');
  var Locale = require('core/Locale');
  var Storage = require('core/Storage');
  
  function Action() {
  }
  
  function convert_action(action_src, actions_map, context) {
    var dfd = new $.Deferred;
    
    var entry = null;
    Storage.read(Class.FUNCTION_ENTRY_ID, action_src.function_entry.id).done(function (data) { entry = data; })
    .then(function() {
      require([entry.require_path], function(Module) {
        var func = Module[action_src.name];
        // { id:"search", type:"html",   text:"Search", icon:"fa fa-search",     html:search_generator }
        actions_map[action_src.name] = {
          id      : action_src.name,
          type    : "button",
          text    : Locale.translate(action_src.label),
          icon    : "fa " + action_src.font_icon,
          onClick : func,
          context : context
        }
        dfd.resolve();
      });
    });
    
    return dfd.promise();
  }
  
  Action.convert = function (actions_src, context) {
    var dfd = new $.Deferred;
    
    if (!actions_src) {
      dfd.resolve();
      return dfd.promise();
    }
    var promises = [];
    var actions_map = {};
    for (var i = 0; i < actions_src.length; i++) {
      var action_src = actions_src[i];
      var promise = convert_action(action_src, actions_map, context);
      promises.push(promise);
    }
    
    $.when.apply(null, promises)
    .done(function() {
      var actions_dst = [];
      for (var i = 0; i < actions_src.length; i++) {
        var action_src = actions_src[i];
        var action_dst = actions_map[action_src.name];
        actions_dst.push(action_dst);
      }
      dfd.resolve(actions_dst);
    });
    
    return dfd.promise();
  };

  return Action;
});
