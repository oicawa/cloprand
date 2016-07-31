require.config({
  urlArgs: "version=" + (new Date()).getTime(),
  baseUrl : '/',
  
  shim: {
    'jquery': { exports: '$' },
    'json2': { deps: ['jquery'] },
    'w2ui': { deps: ['jquery'] },
    'app': { deps: ['jquery'] }
  },
  
  paths : {
    jquery : '/lib/jquery-2.1.3',
    json2 : '/lib/json2',
    w2ui : '/lib/w2ui-1.4.3/w2ui-1.4.3.min',
    app : '/core/app'
  }
});

define(['app'], function (app) {
  app.init();
});
