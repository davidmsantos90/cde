var BaseSearch = Base.extend({

  id: undefined,

  constructor: function(id, searchBox) {
    //creates search
    this.id = id;
    this.searchBox = searchBox;

  },

  bindEvent: function() {
    var myself = this;
    $("#"+ this.id + " input").keyup(function(e) {
      var $this = $(this);

      myself.filter($this.val());
      $this.focus();
    });
  },

  fuzzySearch: function() {
    //insert fuzzyness
  }
});

var PropertiesSearch = BaseSearch.extend({

  tableManager: undefined,

  constructor: function(id, tablemanager) {
    //creates property search
    this.tableManager = tablemanager;
    this.base(id);
    console.log('Properties Search Created');
    this.bindEvent();
  },
  
  filter: function(term) {
    if(!term.length) {
      this.tableManager.init();
    } else if(term.length < 3) {
      return;
    } else {
      //this.fuzzySearch(term)
      var searchElements = this.tableManager.getTableModel().getData();
      for(var i = 0, L = searchElements.length; i < L; i++) {
        var item = searchElements[i];
        if(item.description.toLowerCase().indexOf(term) > -1) {
          $("#" + item.id).show();
        } else {
          $("#" + item.id).hide();
        }
      }
    }
  }
});