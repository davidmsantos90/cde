var BaseSearch = Base.extend({

  id: undefined,
  tableManager: undefined,
  acceptFuzzyScore: undefined,

  constructor: function(id, score) {
    //creates search
    this.id = id;
    this.acceptFuzzyScore = score || 0.8;
  },

  bindEvent: function(searchBox) {
    var myself = this;
    var tableId = this.tableManager ? this.tableManager.getId() : 'pallete';
    $("#"+ this.id + " input").keyup(function(e) {
      var $this = $(this);

      var filter = _.throttle(function() { myself.filter($this.val()) }, 1000);
      filter();
      $this.focus();
    });
    if(searchBox){
      var $input = searchBox.find("input");

      searchBox.click(function(e) {
        var $advancedProps = $("#" + tableId + " .advancedProperties.propertiesUnSelected");

        if(e.target.tagName === 'SPAN') {
          $input.toggle(400);
          $input.focus();

          if($input.val().length > 0) {
            $input.val("");
            $input.keyup();
          }

          if($input.hasClass('collapsed')) {
            $input.removeClass('collapsed');
            $advancedProps.click();
          } else {
            $input.addClass('collapsed');
          }

        } else {
          $advancedProps.click();
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

  normalizeSearchParam: function(string) {
    var upper = false;
    string = string.replace(/([A-Za-z_])/g, function(s) {
      if(s === '_') {
        upper = false;
        return ' ';
      }

      if(s === s.toUpperCase() && !upper) {
        upper = true;
        return ' ' + s;
      }

      if(s === s.toLowerCase()) {
        upper = false;
      }

      return s;
    }).replace(/\s+/g, ' ');

    return string.toLowerCase().trim();
  },

  searchAndValidate: function(term, string) {
    var searching;
    if(term.indexOf(' ') > -1) {
      searching = [string];
    } else {
      searching = string.split(' ');
    }

    for(var i = 0, L = searching.length; i < L; i++) {
      if(BaseSearch.fuzzySearch(term, searching[i]) > this.acceptFuzzyScore) {
        return true;
      }
    }

    return false;
  }

}, {

  fuzzySearch: function(s1, s2) {
    var boostThreshold = 0.7,   //constant, user defines
        scalar = 0.1,           //constant, user defines
        commonStart = 0,        //max: 4, common chars from the start of both strings
        length1 = s1.length,
        length2 = s2.length,
        interval = Math.floor( ( Math.max(length1, length2)/2 ) - 1 ),  //Determines the range for matching chars
        matching = 0,
        transpositions = 0;

    //calculate matching chars
    var match1 = [],
        match2 = [];  //matching chars in s1 and s2, used to calculate transpositions

    for(var i = 0; i < length1; i++) {
      var char1 = s1.charAt(i);
      var start = Math.max(0, i - interval);
      var end = Math.min(length2, i + interval + 1);
      for(var j = start; j < end; j++) {
        var char2 = s2.charAt(j);
        if(!match2[j] && char1 == char2) {
          match1[i] = char1;
          match2[j] = char2;
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
      match1 = match1.filter(function(elem) {
        return elem != undefined;
      });
      match2 = match2.filter(function(elem) {
        return elem != undefined;
      });

      for(i = 0; i < match1.length; i++) {
        if(match1[i] != match2[i]) {
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

  reset: function() {
    $("#" + this.tableManager.getTableId() + " tbody tr").show();
  },

  filter: function(term) {

    if(term.length < 2) {
      this.reset();
    } else {
      var searchElements = this.tableManager.getTableModel().getData();
      for(var i = 0, L = searchElements.length; i < L; i++) {
        var item = searchElements[i];

        if(this.searchAndValidate(term.toLowerCase(), this.normalizeSearchParam(item.description))) {
          $("#" + item.id).show();
        } else {
          $("#" + item.id).hide();
        }
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
      this.preFilter();           //get groups in the table
      indexManager.updateIndex();

      for(var key in this.searchGroups) {
        if(this.searchGroups.hasOwnProperty(key)) {
          var hideGroup = true;
          var group = $("tr#" + key);
          var children = index[key].children;

          if(group.is('.collapsed')) group.toggleBranch(); //guaranty branch is expanded before starting search

          for(var i = 0, L = children.length; i < L; i++) {
            var hideNode = true;
            var node = children[i];

            if(this.searchAndValidate(term.toLowerCase(), this.normalizeSearchParam(node.description + ' ' + node.name))) {
              hideGroup = false;
              $("#" + node.id).show();
            } else {
              $("#" + node.id).hide();
            }
          }

          if(hideGroup) { //hide group if no children is being shown
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
      if(this.searchGroups.hasOwnProperty(key)) {
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
    var myself = this;
    
    if(term.length < 2) {
      this.reset();
    } else {
      var filtered = {};
      _.each(this.palleteManager.getEntries(), function(entry) {
          if(myself.searchAndValidate(term.toLowerCase(), myself.normalizeSearchParam(entry.name))) {
            if(filtered[entry.category]) {
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
