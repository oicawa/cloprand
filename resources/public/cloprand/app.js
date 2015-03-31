require.config({
  urlArgs: "version=" + (new Date()).getTime(),
  baseUrl : '/cloprand',
  
  shim: {
    'jquery': { exports: '$' },
    'json2': { deps: ['jquery'] },
    'jquery_ui': { deps: ['jquery'] },
    'jsrender': { deps: ['jquery'] },
    'jquery_splitter': { deps: ['jquery'] },
    'Cloprand': { deps: ['jquery'] }
  },
  
  paths : {
    jquery : '/lib/jquery-2.1.3',
    json2 : '/lib/json2',
    jquery_ui : '/lib/jquery-ui-1.11.4/jquery-ui',
    jsrender: '/lib/jsrender',
    jquery_splitter : '/lib/jquery.splitter/js/jquery.splitter-0.14.0',
    Cloprand : 'Cloprand'
  }
});

define(['Cloprand'], function (Cloprand) {
  var cloprand = new Cloprand();
  cloprand.init();
});
