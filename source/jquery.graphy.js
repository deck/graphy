//
// This file is part of Graphy.
// 
// Graphy is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser Public License
// as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later 
// version.
//
// Graphy is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
// warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser Public License for more details.
//
// You should have received a copy of the Lesser General Public License along with Graphy. If not, see 
// <http://www.gnu.org/licenses/>.
//

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
} );