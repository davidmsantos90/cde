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

  fuzzySearch: function(s1, s2) {

    var boostThreshold = 0.7, //constant, user defines
        scalar = 0.1,         //constant, user defines
        commonStart = 0,
        length1 = s1.length,
        length2 = s2.length,
        matching = 0,
        transpositions = 0,
        interval = Math.floor( ( Math.max(length1, length2)/2 ) - 1 );

    //calculate matching chars
    var match1 = [],
        match2 = [];

    for(var i = 0; i < length1; i++) {
      var char1 = s1.charAt(i);
      var start = Math.max(0, i - interval);
      var end = Math.min(length2, i + interval);
      for(var j = start; j < end; j++) {
        if(!match2[j] && char1 == s2.charAt(j)) {
          match1[i] = char1;
          match2[j] = s2[j];
          matching++;
          break;
        }
      }
    }

    var jaroDistance;
    if(!matching) {
      jaroDistance = 0;

    } else {
      //calculate transpositions
      match1 = match1.join("");
      match2 = match2.join("");
      for(i = 0; i < match1.length; i++) {
        if(match1.charAt(i) != match2.charAt(i)){
          //if(match1[1] != match2[i]) {
          transpositions++;
        }
      }
      transpositions /= 2;

      jaroDistance = (1/3) * ((matching/length1) + (matching/length2) + ((matching-transpositions)/matching));
    }

    var jaroWinklerDistance;
    if(jaroDistance < boostThreshold) {
      jaroWinklerDistance = jaroDistance;
    } else {
      for(i = 0; i < Math.min(4, length2); i++) { // commonStart scalar goes to a maximum of 4
        if(s1[i] == s2[i]) {
          commonStart++;
        } else {
          break;
        }
      }

      jaroWinklerDistance = jaroDistance + ( commonStart * scalar * ( 1 - jaroDistance ) );
    }

    return jaroWinklerDistance;
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
      indexManager.updateIndex();

      for (var key in this.searchGroups) {
        if (this.searchGroups.hasOwnProperty(key)) {
          var hideGroup = true;
          var group = $("tr#" + key);
          var children = index[key].children;

          if (group.is('.collapsed')) group.toggleBranch(); //guaranty branch is expanded before starting search

          for (var i = 0, L = children.length; i < L; i++) {
            var node = children[i];
            var search = node.description.toLowerCase().split(" ").concat( node.name.toLowerCase().split(" ") );
            var hideNode = true;
            for(var j = 0, N = search.length; j < N; j++) {
              if(this.fuzzySearch(term, search[j]) > 0.75) {
                hideNode = false;
                break;
              }
            }
            if(hideNode) {
              $("#" + node.id).hide();
            } else {
              hideGroup = false;
              $("#" + node.id).show();
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

  reset: function() {
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
