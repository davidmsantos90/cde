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

var PalleteSearch = BaseSearch.extend({

  tableManager: undefined,

  constructor: function(id, palleteManager) {
    this.palleteManager = palleteManager;
    this.base(id);
    console.log('Pallete Search Created');
    this.bindEvent();
  },
  
  filter: function(term) {

    if(!term.length) {
      this.palleteManager.render();
    } else if(term.length < 3) {
      return;
    } else {
      //this.fuzzySearch(term)
      var filtered = {};
      _.each(this.palleteManager.getEntries(), function(entry){
        if (entry.name && entry.name.toLowerCase().indexOf(term.toLowerCase()) > -1) {
          if (filtered[entry.category]) {
            filtered[entry.category].entries.push(entry.getGUID());
          } else {
            filtered[entry.category] = {
              category: entry.category,
              entries: [entry.getGUID()]
            };
          }
        }
        console.log("iterations");
      });
      this.palleteManager.renderFiltered(filtered);
    }
  
  }
});