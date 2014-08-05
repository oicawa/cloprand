var cloprand = {
  post : function(post_path, post_data, init, success_proc, error_proc) {
    init();
    $.ajax({
      type: "post",
      dataType: "json",
      data: post_data,
      cache: true,
      url: "http://localhost:3000/" + post_path,
      success: success_proc,
      error: error_proc
    });
  },
  
  initialize : function(){
    $("#tabs").tabs({ heightStyle : 'fill' });
    $("#home").append("<div class='menu_button' id='table_manager_button'>テーブル管理</div>");
    $("#home").append("<div class='menu_button'>ダミー</div>");
    $("#table_manager_button").click(function() {
      var tabs = cloprand.widgets.tabs('tabs');
      //if (tabs.exists('table_manager')) {
      //  tabs.add('table_manager', 'テーブル管理', { contents : 'テーブル管理画面です。' });
      //}
      tabs.add('table_manager', 'テーブル管理', { contents : 'テーブル管理画面です。' });
      tabs.select('table_manager');
    });
  },
  
  table_admin : function () {
    $("#create_table_button").click(function() {
      var table_name = $("input[name='table_name']").val();
      create_table(table_name);
      return false;
    });
    $("#delete_table_button").click(function() {
      var table_name = $("input[name='table_name']").val();
      delete_table(table_name);
      return false;
    });
    $("#get_tables_button").click(function() {
      get_tables();
      return false;
    });
  },
};

