(function(ko, $, app, kea) {
  "use strict";

  ko.bindingHandlers.komplete = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
      var $container    = $(element),
          options       = ko.unwrap(valueAccessor()),
          $searchInput,
          listener,
          AutocompleteVm,
          AutocompleteResult,
          vm,
          vmName;
      
      AutocompleteResult = function AutocompleteResult(label, value, rawResult) {
        this.label     = label;
        this.value     = value;
        this.rawResult = rawResult;
        this.hasFocus  = ko.observable(false);
      };
      
      AutocompleteVm = function AutocompleteVm(url, autoSelect, selectCallback) {
        this.url               = url;
        this.autoSelect        = autoSelect;
        this.selectCallback    = selectCallback;
        this.responseMap       = {label: 'label', value: 'value'};
        this.searchTerm        = ko.observable('').extend({ rateLimit: { timeout: 500, method: "notifyWhenChangesStop" } });
        this.requestInProgress = ko.observable(false);
        this.hasFocus          = ko.observable(false);
        
        this.showDropdown      = ko.computed(function() {
          return this.searchResults().length > 0 && this.hasFocus();
        }, this, {deferEvaluation: true}).extend({ rateLimit: { timeout: 250, method: "notifyWhenChangesStop" } });
        
        this.searchTerm.subscribe(function() {
          if (this.searchTerm() && this.searchTerm().length > 0) {
            this.fetch();
          }
        }, this);
        
        this.searchResults     = ko.observableArray([]);
      };
      
      AutocompleteVm.prototype.focusedResult = function focusedResult(results) {
        return ko.utils.arrayFirst(this.searchResults(), function(result) { return result.hasFocus(); });
      };
      
      AutocompleteVm.prototype.focusOffset = function focusOffset(idxOffset) {
        var currentFocus = this.focusedResult(),
            focusedIdx   = currentFocus      ? this.searchResults().indexOf(currentFocus)   : -1,
            futureFocus  = focusedIdx !== -1 ? this.searchResults()[focusedIdx + idxOffset] : null;
        
        if (!currentFocus && this.searchResults()[0]) {
          this.searchResults()[0].hasFocus(true);
          return;
        }
           
        if (!futureFocus) { return; }
        
        currentFocus.hasFocus(false);
        futureFocus.hasFocus(true);
      };
      
      AutocompleteVm.prototype.focusNext = function focusNext() {
        this.focusOffset(1);
      };
      
      AutocompleteVm.prototype.focusPrevious = function focusPrevious() {
        this.focusOffset(-1);
      };
      
      AutocompleteVm.prototype.select = function select(result) {
        this.selectCallback.call(bindingContext.$data, result);
        this.reset();
      };
      
      AutocompleteVm.prototype.reset = function reset() {
        this.searchTerm('');
        this.searchResults.removeAll();
        this.requestInProgress(false);
      };
      
      AutocompleteVm.prototype.fetch = function fetch(results) {
        var that = this;
        
        this.requestInProgress(true);
        
        kea.services.Base._request('GET', this.url, { q: this.searchTerm() })
          .done(function(response) {
            that.searchResults( that.parseResults(response) );
            
            if (that.autoSelect && that.searchResults()[0]) {
              that.searchResults()[0].hasFocus(true);
            }
          })
          .always(function() {
            that.requestInProgress(false);
          });
      };
      
      AutocompleteVm.prototype.parseResults = function parseResults(results) {
        var labelKey = this.responseMap.label,
            valueKey = this.responseMap.value;
            
        return results.map(function(result) {
          return new AutocompleteResult(result[labelKey], result[valueKey], result);
        });
      };
      
      if (DEBUG) { console.assert(options.url || options.fetch || options.vm, "Provide either an autocomplete URL, a custom fetch method or a custom AutocompleteVM"); }
      if (DEBUG) { console.assert(options.onSelect, "onSelect callback missing"); }
      
      options.autoSelect   = typeof options.autoSelect !== 'undefined' ? options.autoSelect : true;
      options.blurOnSelect = typeof options.blurOnSelect !== 'undefined' ? options.blurOnSelect : true;
      
      vm = options.vm || new AutocompleteVm(options.url, options.autoSelect, options.onSelect);
      
      if (options.observable) {
        ko.computed(function() {
          vm.searchTerm( options.observable() );
          
        }, this, { disposeWhenNodeIsRemoved: element });
      }
      
      if (options.fetch) {
        vm.fetch = options.fetch;
      }
      
      if (options.responseMap) {
        vm.responseMap = options.responseMap;
      }
      
      if (options.parseResults) {
        vm.parseResults = options.parseResults;
      }
      
      $container.on('componentReady', function() {
        $searchInput = $container.find('> .komplete-search-term');
        listener     = new window.keypress.Listener( $searchInput.get(0) );
        
        $searchInput.on('focus', function() {
          vm.hasFocus(true);
        });
        
        $searchInput.on('blur', function() {
          vm.hasFocus(false);
        });
        
        listener.register_combo({
          keys: "down",
          on_keydown: function() { vm.focusNext(); }
        });
        
        listener.register_combo({
          keys: "up",
          on_keydown: function() { vm.focusPrevious(); }
        });
        
        listener.register_combo({
          keys: "enter",
          on_keydown: function() {
            if (!options.autoSelect && !vm.focusedResult()) {
              if (options.blurOnSelect) {
                $searchInput.get(0).blur();
              }
              
              vm.select( $searchInput.val() );
              
            } else if (options.autoSelect && !vm.focusedResult()) {
              return;
              
            } else {
              if (options.blurOnSelect) {
                $searchInput.get(0).blur();
              }
              
              vm.select( vm.focusedResult() );
            }
          }
        });
        
        $container.on('click', function() {
          $searchInput.focus();
        });
      });
      
      ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
        if (listener) {
          listener.destroy();
        }
      });
      
      return ko.bindingHandlers.with.init(element, function() { return vm; }, allBindingsAccessor, viewModel, bindingContext);
    },
    update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

    }
  };

})(ko, $, window.app, window.kea);