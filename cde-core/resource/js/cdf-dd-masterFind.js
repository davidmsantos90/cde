var BaseSearch = Base.extend({

  id: undefined,
  tableManager: undefined,

  constructor: function(id) {
    //creates search
    this.id = id;
  },

  bindEvent: function(searchBox) {
    var myself = this;
    $("#"+ this.id + " input").keyup(function(e) {
      var $this = $(this);

      var filter = _.throttle(function() { myself.filter($this.val()) }, 1000);
      filter();
      $this.focus();
    });
    if (searchBox){
      var $input = searchBox.find("input");
      searchBox.find("button").click(function(){
        $input.toggle(400);
        if ($input.val().length > 0) {
          $input.val("");
          $input.keyup();
        }
      });
    }
  },

  filter: function() {
    //default does nothing
  },

  reset:function() {
    //default does nothing
  },

  fuzzySearch: function() {
    //insert fuzzyness
  }
});

var PropertiesSearch = BaseSearch.extend({

  constructor: function(id, tablemanager) {
    //creates property search
    this.logger = new Logger("PropertiesSearch");
    this.tableManager = tablemanager;
    this.base(id);
  },

  filter: function(term) {
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

});

var MainTableSearch = BaseSearch.extend({

  searchGroups: undefined,

  constructor: function(id, tablemanager) {
    //creates MainTable search
    this.logger = new Logger("MainTableSearch");
    this.tableManager = tablemanager;
    this.base(id);
  },

  preFilter: function() {
    if(this.searchGroups == undefined) {
      this.searchGroups = {};
      var elements = this.tableManager.getTableModel().getData();

      for(var i = 0, L = elements.length; i < L; i++) {
        var item = elements[i];

        if(item.type === 'Label') {
          var $label = $("tr#" + item.id);
          this.searchGroups[item.id] = {
            isExpanded: $label.is('.expanded')
          };
          continue;
        }
      }
    }
  },

  filter: function(term) {
    var tableModel = this.tableManager.getTableModel();
    var indexManager = tableModel.getIndexManager();
    var index = indexManager.getIndex();

    if(term.length < 2) {
      this.reset();
    } else {
      this.preFilter(); // get groups in the table

      for (var key in this.searchGroups) {
        if (this.searchGroups.hasOwnProperty(key)) {
          var hideGroup = true;
          var group = $("tr#" + key);
          var children = index[key].children;

          if (group.is('.collapsed')) group.toggleBranch(); //guaranty branch is expanded before starting search

          for (var i = 0, L = children.length; i < L; i++) {
            var node = children[i];
            if (node.description.toLowerCase().indexOf(term) > -1 ||
                node.name.toLowerCase().indexOf(term) > -1) {
              hideGroup = false;
              $("#" + node.id).show();
            } else {
              $("#" + node.id).hide();
            }
          }

          if (hideGroup) { //hide group if no children is being shown
            group.hide();
          } else {
            group.show();
          }
        }
      }
    }
  },

  reset: function() {
    for(var key in this.searchGroups) {
      if (this.searchGroups.hasOwnProperty(key)) {
        var group = this.searchGroups[key];
        var group_ui = $("tr#" + key);

        group_ui.removeClass('expanded').removeClass('collapsed').show();

        if(group.isExpanded) {
          group_ui.expand();
        } else {
          group_ui.collapse();
        }
      }
    }
    this.searchGroups = undefined;
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

  reset: function(){
    this.palleteManager.render();
  },
  
  filter: function(term) {
    
    if(term.length < 2) {
      this.reset();
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
      });
      this.palleteManager.renderFiltered(filtered);
    }
  
  }
});
