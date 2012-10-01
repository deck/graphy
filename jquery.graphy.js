$( function() {

  // Turns a json hash into a simple line graph
  $.fn.sparkline = function() {
    this.each( function(i,el) {
	var g = Graphy.createGraph( { canvas: el, width: 40, options: { renderer: 'line' }, xAxisRenderer: 'none', yAxisRenderer: 'none', noHover: true } );
    });
  };
  
  // Creates a graph on the element. See Graphy.createGraph for a description of the spec parameter.
  $.fn.graphy = function(spec) {
    this.each( function(i,el) {
      spec.canvas = el;
      var g = Graphy.createGraph( spec );
    });
  };

});