function is_undefined (value) { return (typeof value === "undefined"); };
function is_null_or_undefined (value) { return (value == null) || is_undefined(value); };
function is_object (target) { return target instanceof Object && Object.getPrototypeOf(target) === Object.prototype; };
function is_array (value) { return Array.isArray(value); }

require.config({
  urlArgs: "version=" + (new Date()).getTime(),
  baseUrl : '/',
  
  shim: {
    'jquery': { exports: '$' },
    'jquery_ui': { deps: ['jquery'] },
    'json2': { deps: ['jquery'] },
    'w2ui': { deps: ['jquery'] },
    'app': { deps: ['jquery'] }
  },
  
  paths : {
    jquery : '/lib/jquery-2.1.3',
    jquery_ui : '/lib/jquery-ui-1.12.1',
    json2 : '/lib/json2',
    w2ui : '/lib/w2ui/w2ui-1.5.rc1',
    app : '/core/app'
  }
});

define(['app'], function (app) {
  app.init();
});
