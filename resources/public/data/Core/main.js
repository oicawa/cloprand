require.config({
  urlArgs: "version=" + (new Date()).getTime(),
  baseUrl : '/',
  
  shim: {
    'jquery': { exports: '$' },
    'json2': { deps: ['jquery'] },
    'jquery_ui': { deps: ['jquery'] },
    'jsrender': { deps: ['jquery'] },
    'w2ui': { deps: ['jquery', 'jquery_ui'] },
    'app': { deps: ['jquery'] }
  },
  
  paths : {
    jquery : '/lib/jquery-2.1.3',
    json2 : '/lib/json2',
    jquery_ui : '/lib/jquery-ui-1.11.4/jquery-ui.min',
    jsrender: '/lib/jsrender',
    w2ui : '/lib/w2ui-1.4.3/w2ui-1.4.3',
    app : '/data/Core/app'
  }
});

//requirejs.onError = function (err) {
//  debugger;
//  console.log(err.requireType);
  //if (err.requireType === 'timeout') {
  //  console.log('modules: ' + err.requireModules);
  //}
  //throw err;
  //location.href = "/index.html";
//};

define(['app'], function (app) {
  app.init();
});
