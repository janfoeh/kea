(function(ko, $) {
  "use strict";

  ko.bindingHandlers.datePicker = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
      var $element      = $(element),
          observable    = valueAccessor(),
          options       = allBindingsAccessor().options || {},
          defaultOptions;

      defaultOptions = {
        field: element,
        firstDay: 1,
        defaultDate: observable.date(),
        format: observable.date.options.external,
        onSelect: function() {
          observable.date.fromMoment( this.getMoment() );
        },
        i18n: {
          previousMonth : 'vorheriger Monat',
          nextMonth     : 'Nächster Monat',
          months        : ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
          weekdays      : ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'],
          weekdaysShort : ['So','Mo','Di','Mi','Do','Fr','Sa']
        }
      };

      options = $.extend({}, defaultOptions, options);
      
      $element.data('pikaday', new Pikaday(options));
    },
    update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
      var observable  = valueAccessor(),
          pikaday     = $(element).data('pikaday');
      
      if (!observable()) {
        pikaday.setDate(null);
      } else {
        pikaday.setMoment( observable.date.toMoment() );
      }
    }
  };

})(ko, $);