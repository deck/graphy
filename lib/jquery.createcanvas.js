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