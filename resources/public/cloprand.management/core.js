cloprand.management = {
  init : function(parent_tab_id, callback) {
    cloprand.load_htmlpart(
      "#" + parent_tab_id,
      "cloprand/list.html #contents",
      null,
      function() {
        if (callback) {
          callback();
         }
        $('#data_table').DataTable({
          bJQueryUI:true,
          "bPaginate": false,
          //"bLengthChange": false,
          //"bFilter": false,
          //"bSort": false,
          //"bInfo": true,
          //"bAutoWidth": false,
          sScrollY : "auto"
         });
       });
  }
};

