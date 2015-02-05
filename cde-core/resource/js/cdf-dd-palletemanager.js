/*!
 * Copyright 2002 - 2014 Webdetails, a Pentaho company.  All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

var PalleteManager = Base.extend({

		id: "",
		palleteId: "",
		logger: {},
		linkedTableManager: undefined,
		categories: {},
		entries: {},

		constructor: function(id){
			this.logger = new Logger("PalleteManager - " + id);
			this.id = id;
			this.setPalleteId(id+"Pallete");
			this.categories = {};
			this.entries = {};
			
			$("#"+this.id).append(this.getDivSearch(id));
			this.$filteredEntriesHolder = $("<div id='filteredEntries' class='filteredEntries' style='display:none;'></div>");
			$("#"+this.id).append(this.$filteredEntriesHolder);
			this.pallete = $(this.newPallete());
			$("#"+this.id).append(this.pallete);
			this.masterFind = new PalleteSearch(id, this);

			// Register this tablemanager in the global area
			PalleteManager.register(this);
		},

		init : function(){

			this.render();

		},

		reset: function(){
			$("#"+this.id).empty();
		},

		newPallete: function(args){

//TODO: temp changed rem <div style = "height: 24px;" />
			var _container = '<div id="' + this.getPalleteId() + '"></div>';
			return _container;
		},


		render: function(){

			this.logger.debug("Rendering pallete " + this.getPalleteId());
			var _placeholder = $("#"+this.getPalleteId());

			// Accordion
			// CDF-271 $.browser is depricated
			var rv;
			var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
			if(re.exec(navigator.userAgent) != null) { rv = parseFloat(RegExp.$1); }

			var accordionOptions = {
					header: "h3",
					active: false,
					heightStyle: "content",
					//event: "mouseover",
					icons: {
						header: "ui-icon-triangle-1-e",
						activeHeader: "ui-icon-triangle-1-s"
					},
					collapsible: true
				};
			if(rv && rv < 9) { 
				accordionOptions.animated = false; 
			}
				
			_placeholder.accordion(accordionOptions);
			this.setFiltered(false);
		},

		getDivSearch: function(id){
			var palleteTitle = (id.indexOf("components") > -1 ? "Components" : "Datasources") + " Pallete";
			var $divSearch = $("<div id='accordionSearchBox' class='masterFind'><div class='simpleProperties propertiesSelected'>" + palleteTitle + "</div></div>");
			var $input = $("<input style='display:none;'></input>");
			var $searchButton = $("<span id='magGlass'></span>");
			$searchButton.click(function(){
				$input.toggle(400);
				if ($input.val().length > 0) {
					$input.val("");
					$input.keyup();
				}
			});
			$divSearch.append($searchButton);
			$divSearch.append($input);
			return $divSearch;
		},

		renderFiltered: function(filtered){
				this.setFiltered(true);


				var filteredTree = "";
				_.each(filtered, function(f){
					filteredTree += "<div id='filteredContainer'><h3><span></span><a>" + f.category + "</a></h3>";
					filteredTree += "<div id='filteredItemsContainer'><ul>";
					_.each(f.entries, function(ent){
						filteredTree += $('<div>').append(this.pallete.find("#" + ent).clone()).html();
					}, this);
					filteredTree += "</ul></div></div>"
				}, this);
				//filteredTree += "</ul>";


				this.$filteredEntriesHolder.html(filteredTree);
		},

		setFiltered: function(flag){
			if (flag) {
				this.pallete.hide();
				this.$filteredEntriesHolder.show();
			} else {
				this.$filteredEntriesHolder.hide();
				this.pallete.show();
			}
		},

		exists: function(object, array){
			var exists = new Boolean(false);
			
			for(var index in array){
				if(array.hasOwnProperty(index)) {
					if(array[index] == object){
						exists = new Boolean(true);
						break;
					}
				}
			}
			return exists;
		},

		addEntry: function(palleteEntry){

			var object = palleteEntry;
			var array = this.getEntries();

			if(this.exists(object, array) == false){
				this.getEntries()[palleteEntry.getId()] = palleteEntry;

				var _cat = palleteEntry.getCategory();
				if(typeof this.getCategories()[_cat] == 'undefined' ) {
					this.createCategory(palleteEntry);
				}
				var guid = TableManager.generateGUID();
				palleteEntry.setGUID(guid);
				this.getCategories()[_cat].push(palleteEntry);

				var _placeholder = $(".pallete-" + _cat +" > ul ", $("#"+this.getPalleteId()) );

				//TODO: this hover ain't pretty, change this...
				//			<li onmouseover="$(this).addClass(\'ui-state-hover\')" onmouseout="$(this).removeClass(\'ui-state-hover\')" ><a class="tooltip" title="' + palleteEntry.getDescription() + '"  href="javascript:PalleteManager.executeEntry(\'' + this.getPalleteId() + '\',\''+ palleteEntry.getId() +'\');">
				var code = '' +
	        '<li id="'+ guid +'">' +
						'<a class="tooltip" title="' + palleteEntry.getDescription() + '"  href="javascript:PalleteManager.executeEntry(\'' + this.getPalleteId() + '\',\''+ palleteEntry.getId() +'\');">\n' +
						palleteEntry.getName() +'\n' + '</a>\n';

				_placeholder.append(code);
			}
		
		},

		createCategory: function(palleteEntry) {
			var guid = palleteEntry.getCategory();
			palleteEntry.setGUID(guid);

			var content = '' +
					'<div id="' + guid + '">\n' +
					'  <h3><a href="#">' + palleteEntry.getCategoryDesc() + '</a></h3>\n' +
					'  <div class="pallete-' + guid + '">\n' +
					'    <ul></ul>\n' +
					'  </div>\n' +
					'</div>\n';


			$("#"+this.getPalleteId()).append(content);

			this.getCategories()[palleteEntry.getCategory()] = [];
					
		},


		// Accessors
		setId: function(id){this.id = id},
		getId: function(){return this.id},
		setPalleteId: function(palleteId){this.palleteId = palleteId},
		getPalleteId: function(){return this.palleteId},
		getLinkedTableManager: function(){return this.linkedTableManager},
		setLinkedTableManager: function(linkedTableManager){this.linkedTableManager = linkedTableManager},
		setCategories: function(categories){this.categories = categories},
		getCategories: function(){return this.categories},
		setEntries: function(entries){this.entries = entries},
		getEntries: function(){return this.entries}

	},{
		palleteManagers: {},
		
		register: function(palleteManager){
			PalleteManager.palleteManagers[palleteManager.getPalleteId()] = palleteManager;
		},

		getPalleteManager: function(id){
			return PalleteManager.palleteManagers[id];
		},

		executeEntry: function(palleteManagerId,id){
			
			var palleteManager = PalleteManager.getPalleteManager(palleteManagerId);
			palleteManager.getEntries()[id].execute(palleteManager);
		}
	});



var PalleteEntry = Base.extend({

  id: "PALLETE_ENTRY",
  guid: "",
  name: "Base operation",
  description: "Base Operation description",
  category: undefined,
  categoryDesc: undefined,
  logger: {},

  constructor: function(){
    this.logger = new Logger("BaseOperation");
  },

  execute: function(palleteManager,stub){
    // Add a new entry

    var tableManager = palleteManager.getLinkedTableManager();
    var rendererType = cdfdd.dashboardWcdf.rendererType;

    var _stub = stub != undefined ? stub : this.getStub();

    if( rendererType == "bootstrap" && this.id == "TABLE_ENTRY" ) {
      this.changeProperty( _stub, "tableStyle", "bootstrap" )
    }

    var rowIdx;
    var colIdx = 0;
    var rowId;
    var rowType;
    var insertAtIdx = -1;

    var indexManager = tableManager.getTableModel().getIndexManager();

    // insertAtIdx = tableManager.getTableModel().getData().length;
    insertAtIdx = tableManager.createOrGetParent( this.category, this.categoryDesc );
    _stub.parent=this.category;

    this.logger.debug("Inserting row after "+ rowType + " at " + insertAtIdx);

    if(_stub.typeDesc == "" || _stub.typeDesc == "" || _stub.typeDesc == "") {
      _stub.typeDesc = _stub.type;
    }
    
    if (_stub.properties){
    	this.fixQueryProperty(_stub.properties, this.category);
    }
    tableManager.insertAtIdx(_stub,insertAtIdx);

    // focus the newly created line
    //atableManager.selectCell(insertAtIdx,colIdx);

    // edit the new entry - we know the name is on the first line
    if( typeof tableManager.getLinkedTableManager() != 'undefined' ) {
      $("table#" + tableManager.getLinkedTableManager().getTableId() +" > tbody > tr:first > td:eq(1)").trigger('click');
    }

    return _stub;
  },
	fixQueryProperty: function(props, cat) {
		$.each(props, function(i, prop) {
			if (prop.name == "query") {
				switch (cat) {
					case "MDX":
						prop.type = "CurrentMdxQuery";
						break;
					case "SQL":
						prop.type = "SqlQuery";
						break;
					case "OLAP4J":
						prop.type = "CurrentMdxQuery";
						break;
					case "MQL":
						prop.type = "MqlQuery";
						break;
					case "XPATH":
						prop.type = "XPathQuery";
						break;
					case "SCRIPTING":
						prop.type = "ScriptableQuery";
						break;
					default:
						prop.type = "DefaultQuery";
				}
				return false;
			}
		});
	},

  getStub: function(){
    this.logger.warn("NOT IMPLEMENTED YET");
  },

  changeProperty: function( stub, name, value ) {
    _.each( stub.properties, function( prop, i ) {
      if( prop.name == name ) {
        prop.value = value;
        return;
      }
    });
  },

  getId: function(){return this.id},
  setId: function(id){this.id = id},
  setGUID: function(guid) {this.guid = guid;},
  getGUID: function() {return this.guid;},
  getName: function(){return this.name},
  setName: function(name){this.name = name},
  getCategory: function(){return this.category},
  setCategory: function(category){this.category = category},
  getCategoryDesc: function(){return this.categoryDesc},
  setCategoryDesc: function(categoryDesc){this.categoryDesc = categoryDesc},
  getDescription: function(){return this.description},
  setDescription: function(description){this.description = description},
  getIcon: function(){return this.icon},
  setIcon: function(icon){this.icon = icon}

});


var PalleteWizardEntry = PalleteEntry.extend({

  // override this
  execute: function( palleteManager ) {

    this.renderWizard();
  },

  // and this
  apply: function(palleteManager) {

    this.logger.fatal("Not done yet");

  }

},{
});
