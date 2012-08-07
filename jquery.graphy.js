$( function() {

  // Turns a json hash into a simple line graph
  $.fn.sparkline = function() {
    this.each( function(i,el) {
	var g = Graphy.create_graph( { canvas: el, width: 40, options: { renderer: 'line' }, x_axis_renderer: 'none', y_axis_renderer: 'none', no_hover: true } );
    });
  };
  
  // Creates a graph on the element. See Graphy.create_graph for a description of the spec parameter.
  $.fn.graphy = function(spec) {
    this.each( function(i,el) {
      spec.canvas = el;
      var g = Graphy.create_graph( spec );
    });
  };

});