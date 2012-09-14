// Copyright 2010-2012 DECK Monitoring LLC.
//
// This file is part of Graphy from DECK Monitoring LLC.
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
(function( $ ) {
  function getCanvas(w, h, $container){
      // With a single tag like this, jQuery creates the DOM element using the native
      // createElement function, which is necessary in order to create a canvas element
      // that will work with excanvas in IE.
      var $canvas = $("<canvas/>").attr({  
        width: w,
        height: h
      });
      
      if($container){
        $container.empty().append($canvas);
      }
      
      if (typeof(G_vmlCanvasManager) != 'undefined'){
        G_vmlCanvasManager.initElement($canvas.get(0));
      }
      
      return $canvas;
  }
  
  $.extend({
    // Returns a jQuery object containing a single excanvas-compatible canvas the given width and height
    createCanvas: function (w, h) {
      if (isNaN(w)) { w = 300; }
      if (isNaN(h)) { h = 200; }
      
      return getCanvas(w, h);
    }
  });

  // Creates an excanvas-compatible canvas the same width and height as the given element
  // and replaces the given element's contents with the new canvas
  $.fn.createCanvas = function() {
    return this.each(function() {
      getCanvas($(this).width(), $(this).height(), $(this));
    });
  };
})( jQuery );