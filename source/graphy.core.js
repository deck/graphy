//
//
//    .oooooo.                                  oooo                    
//   d8P'  `Y8b                                 `888                    
//  888           oooo d8b  .oooo.   oo.ooooo.   888 .oo.   oooo    ooo 
//  888           `888""8P `P  )88b   888' `88b  888P"Y88b   `88.  .8'  
//  888     ooooo  888      .oP"888   888   888  888   888    `88..8'   
//  `88.    .88'   888     d8(  888   888   888  888   888     `888'    
//   `Y8bood8P'   d888b    `Y888""8o  888bod8P' o888o o888o     .8'     
//                                    888                   .o..P'      
//                                   o888o                  `Y8P'
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
//
// Say hello to our graphing module. 
//
// It has one instantiating function: 
//   create_graph: This creates a graph on an element and provides you with several functions to work with it.
// and one array:
//   graphs: []
//
// Each graph has an id (graph.index). This is it's index in the Graphy.graphs[] array.
//
// There are also four packages in here:
//   interval: Millisecond variables for different time intervals (second, minute, etc.)
//   formatters: Changes number values to text.
//   renderers: All actual graphics making is handle in here.
//   util: Common (hopefully useful) graphing functions.
//  
//

var Graphy = {
 
	version: "1.2012.08.15",
  graphs: [],
  css_is_ready: false,
 
  //
  // Creates a graph on a canvas element according to a "spec" hash. The hash may contain the following keys:
  // 
  // canvas [required]: Selector for a canvas element or any other html element (which will be transformed
  //                    into a canvas). If this contains text, Graphy will assign this text to plot_json in
  //                    the spec.
  // plot: Calls self.plot with value as parameter.
  // plots: Calls self.plots with value as parameter.
  // plot_json: Calls self.plot_json with value as parameter.
  // options: Sets the default style information for plots. Plots may override this. These are renderer
  //        specific. Example: {"width": 2, "color": "red", "unit": "oxen/m³"}
  // x_axis_interval: Specify a fixed interval. See Graphy.interval.
  // x_axis_label_formatter: Function or string name of function to format label text. See Graphy.formatters.
  // x_axis_renderer: Function or string name of function to render x axis. See Graphy.renderers.axis.
  //                  (default: "clean_x")
  // y_axis_renderer: Function or string name of function to render y axis. See Graphy.renderers.axis.
  //                  (default: "clean_y")
  //
  //
  create_graph: function(spec) {
    var self = {};

    // see: plot, plots, and plot_jsons for accessors
    var _plots = [];
   
    // have read/write accessors
    var _canvas,
        _y_axis_renderer, 
        _x_axis_renderer, 
        _x_axis_label_formatter, 
        _x_axis_interval,
		    _v_rule_label = false,
        _no_hover,
        _options = {};
       
    // have read-only accessors
    var _$canvas,
        _ctx, 
        _index = Graphy.graphs.push(self) - 1,
        _value_rect = false,
        _graph_rect = false,
        _x_units = [],
        _y_units = [],
        _value_rect_by_unit = {},
        _selected_plot_count = 0;
   
    // private vars
    var _$hoverLine,
        _hoverLine,
        _hoverLineCtx;
   
    //
    // gets the canvas and context and calls any spec'd functions 
    //
    var init = function(spec) {
      if ( spec.options ) { self.options(spec.options); }
      if ( spec.canvas ) { self.canvas(spec.canvas); }
      self.no_hover(true);
     
      if ( spec.x_axis_interval ) { self.x_axis_interval(spec.x_axis_interval); }
      if ( spec.x_axis_label_formatter ) { self.x_axis_label_formatter(spec.x_axis_label_formatter); }
      if ( spec.x_axis_renderer ) { self.x_axis_renderer(spec.x_axis_renderer); }
      if ( spec.y_axis_renderer ) { self.y_axis_renderer(spec.y_axis_renderer); }
      if ( spec.v_rule_label ) { self.v_rule_label(spec.v_rule_label); }
     
      if ( spec['plot'] ) { self.plot(spec['plot']); }
      if ( spec['plots'] ) { self.plots(spec['plots']); }
      if ( spec['plot_json'] ) { self.plot_json(spec['plot_json']); }
     
      if ( _plots.length ) { self.draw(); }
    }

    //
    // Removes all Highlighted Points from all _plots
    //
    self.removeHighlightPoints = function(){
      if(_hoverLine) {
        // cursor is outside of the graph area, so remove the hover line
        _$hoverLine.remove();
        _$hoverLine = _hoverLine = _hoverLineCtx = null;
      }
      $.each(_plots, function() {
        if(this.removeHighlightPointIfExists) this.removeHighlightPointIfExists();
      });
    }
     
    //
    // draws it up if the css is all ready. if not, it waits until it can see it.
    //
    self.draw = function () {
      if ( Graphy.css_is_ready ) { 
        drawForReal(); 
      } else {
        var $test = $("<div class='graphy_css_loaded' style='display:hidden;'></div>");
        $('body').append($test);

        var interval = setInterval( function() {
          if( $test.css('position') == 'absolute' ) {
            clearInterval(interval);
            Graphy.css_is_ready = true;
            drawForReal();
          }
        }, 10 );
      }
    };

    //
    // Position/conversion helpers
    //
    self.fromDocumentPixelToGraphRectPixel = function(documentPixel) {
      var o = _$canvas.offset();
      return {
        x: documentPixel.x - o.left,
        y: documentPixel.y - o.top
      };
    }
    self.fromGraphRectPixelToDocumentPixel = function(graphRectPixel) {
      var o = _$canvas.offset();
      return {
        x: graphRectPixel.x + o.left,
        y: graphRectPixel.y + o.top
      };
    }
   
    var drawForReal = function() {
      if ( !_ctx ) { return; }

      _ctx.save();
      _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
      $(".graphy_axis_label_" + _index).remove();

      if (_plots.length > 0) {        
        // draw the axis (order is important here)
        if ( !_y_axis_renderer ) { _y_axis_renderer = Graphy.renderers.axis.clean_y; }
        if ( !_x_axis_renderer ) { _x_axis_renderer = Graphy.renderers.axis.clean_x; }
        _y_axis_renderer( "measure", self );
        _x_axis_renderer( "measure", self );        
        _y_axis_renderer( "draw", self );
        _x_axis_renderer( "draw", self );
       
        // render the plots
        var options, renderer, rendererIndexes = {},
          indexByPlot = {};
        $.map(_plots, function(el,i) { indexByPlot[el] = i; });

        _plots = _plots.sort(function(a,b){ 
          // both bars or neither bars
          if((a.options.renderer == 'bar') == (b.options.renderer == 'bar'))
            return indexByPlot[a] - indexByPlot[b];
          else if(a.options.renderer == 'bar')
            return -1;
          else if(b.options.renderer == 'bar')
            return 1;
        });
           
        for (var i = 0; i < _plots.length; i++) {
          options = $.extend({}, _options, _plots[i].options);
          renderer = Graphy.util.function_by_name_or_function(options.renderer, Graphy.renderers, Graphy.renderers.plot);
          if (rendererIndexes[renderer] == undefined) rendererIndexes[renderer] = 0;
          rendererIndexes[renderer] += 1;
          renderer(rendererIndexes[renderer], _plots[i].data, options, self);          
        }      
      }
     
      _ctx.restore();
    }
   
    //
    // accessor for canvas
    //
    // param set_canvas is a jQuery selector
    // returns the canvas (html) object
    //
    self.canvas = function( set_canvas ) {
      if ( set_canvas ) {
       
        var $target = $( set_canvas ).first();
        _$canvas = $target;
       
        if(!$target.is('canvas')){
          _$canvas = $target.createCanvas().find('canvas');
        } else {
          // For non-dynamically created canvas elements, we need to 
          // do some magic for IE 7 & 8 to make them usable with excanvas.
          if (typeof(G_vmlCanvasManager) != 'undefined'){
            G_vmlCanvasManager.initElement(_$canvas.get(0));
          }
        }
        _canvas = _$canvas.get(0);
        _$canvas.addClass("graphy_canvas");
        _$canvas.data( { graph: self } );

        // get the canvas context and set the graph_rect initial size
        if (!_canvas.getContext) { console.warn("No canvas context found."); return; }
        _ctx = _canvas.getContext('2d');
        _graph_rect = Graphy.util.create_rect();
        _graph_rect.right = _canvas.width - 2;
        _graph_rect.bottom = _canvas.height;

        // each graph needs to watch mouse movement to check if cursor enters or leaves graph area
        // mouseover and mouseout do not work because the hover line triggers these events continually since the mouse is over that, not the graph area
        // TODO: put this code somewhere else, it should not be inlined here
        $(document).on('mousemove', function(e) {
          if(self.no_hover()) {
            return;
          }
          var o = _$canvas.offset();
          // check if cursor is inside graph area
          if(e.pageX > (o.left + _graph_rect.left) && e.pageX < (o.left + _graph_rect.right) && e.pageY > (o.top + _graph_rect.top) && e.pageY < (o.top + _$canvas.height())) {
            // draw the hoverline if it does not exist
            if(!_hoverLine) {
              _$hoverLine = $.createCanvas(2, _graph_rect.bottom).css('position', 'absolute').css('z-index', 1500),
              _$hoverLine.prependTo('body').addClass('graphy');
              _hoverLine = _$hoverLine.get(0);
              _hoverLineCtx = _hoverLine.getContext('2d');

              // draw the base hover line
              _hoverLineCtx.lineWidth = 2;
              _hoverLineCtx.moveTo(0, 0);
              _hoverLineCtx.lineTo(0, _$hoverLine.height());
              _hoverLineCtx.strokeStyle = '#aaa';
              _hoverLineCtx.stroke();

              // set position of top - this will not change since the bar moves horizontally
              _$hoverLine.offset({ top: _$canvas.offset().top });
            }

            // reposition on horizontal axis to line up with cursor
            _$hoverLine.offset({ left: e.pageX });

            var toHighlight = []; // array of objects with a plot and point property
            $.each(_plots, function() {
              var plotPoint = this.fromDocumentPixelToPlotPoint({x: e.pageX, y:e.pageY});

              // values are in-order along x-axis in this.data, so find closest point to cursor with simple binary search
              var i, dataX, low = 0,
                high = this.data.length-1;
              while(low!=high) {
                i = low+Math.floor((high-low)/2);
                if(this.data && this.data[i]){
                  dataX = this.data[i][0];
                }

                if(plotPoint.x < dataX) high = i;
                else if(plotPoint.x > dataX) {
                  // break if point is closer to the value we're throwing out than the value that will be the new low
                  if(plotPoint.x - dataX < this.data[i+1][0] - plotPoint.x) break;
                  low = ++i;
                }
                else break; // found exact match.
              }

              if(this.data.length == 1) i = 0;
              var nearestPoint = [0,0];
              if(this.data && this.data[i]){
                nearestPoint = this.data[i];
              }
             
              var pixel = this.fromPlotPointToDocumentPixel({x:nearestPoint[0],y:nearestPoint[1]});
              var closeEnoughToDraw = Math.abs(pixel.x - e.pageX) < 15;

              if(closeEnoughToDraw && this.options.renderer != 'bar' && (!this.graphy.has_selected_items() || this.options.selected)) {
                toHighlight.push({plot: this, point: nearestPoint, pixel: pixel});
              } else {
                this.removeHighlightPointIfExists();
              }
            });

            // sort toHighlight by awesomeness
            toHighlight = toHighlight.sort(function(a,b) { return a.pixel.y - b.pixel.y; });

            var groups = [],
              labelHeight = 21,
              groupsToMove = 0;
            for(var i=0,len=toHighlight.length; i < len; i++) {
              // TODO: remove this nonsense
              var top = 1500 + i * labelHeight,
                bottom = 1500 + (i+1) * labelHeight,
                desiredPosition = toHighlight[i].plot.fromPlotPointToDocumentPixel({x:toHighlight[i].point[0], y:toHighlight[i].point[1]}).y;
                averageMomentum = desiredPosition - (bottom+top)/2;

              if(averageMomentum != 0) groupsToMove++;

              groups.push({
                top: top,
                bottom: bottom,
                averageMomentum: averageMomentum,
                desiredPosition: desiredPosition,
                items: [$.extend(toHighlight[i], { desiredPosition: desiredPosition })],
                moveBy: function(amount) {
                  this.top += amount;
                  this.bottom += amount;
                },
                reachEquilibrium: function() {
                  this.moveBy(this.averageMomentum);
                  this.averageMomentum = 0;
                },
                moveToAndAbsorb: function(groupToAbsorb) {
                  if(groupToAbsorb.bottom < this.top) { // we are below, move up
                    this.moveBy( groupToAbsorb.bottom - this.top);
                    // append our list of items to what we are absorbing
                    this.items = groupToAbsorb.items.concat(this.items);
                    this.top = groupToAbsorb.top;
                    this.recalculateMomentum();
                  } else { // we are above, move down
                    this.moveBy( groupToAbsorb.top - this.bottom );
                    // prepend our list of items to what we are absorbing
                    this.items = this.items.concat(groupToAbsorb.items);
                    this.bottom = groupToAbsorb.bottom;
                    this.recalculateMomentum();
                  }
                },
                recalculateMomentum: function() {
                  var momentumSum = 0;
                  for(var i=0,len=this.items.length; i < len; i++) {
                    momentumSum += this.items[i].desiredPosition - (this.top + i*labelHeight + labelHeight/2);
                  }
                  this.averageMomentum = momentumSum / this.items.length;
                }
              });
            }

            var i, len = groups.length;
            while( groupsToMove > 0 ) {
              for(i=0; i<len && groupsToMove > 0; i++) {
                if(groups[i].averageMomentum < 0) {
                  // check above
                  if(i > 0 && groups[i-1].bottom > groups[i].top + groups[i].averageMomentum) {
                    var absorbThis = groups.splice(--i, 1)[0];
                    groups[i].moveToAndAbsorb(absorbThis);
                    len--; 
                    if(absorbThis.averageMomentum != 0) groupsToMove--;
                  } else {
                    groups[i].reachEquilibrium();
                    groupsToMove--;
                  }
                } else if(groups[i].averageMomentum > 0) {
                  // check below
                  if(i < (len-1) && groups[i+1].top < groups[i].bottom + groups[i].averageMomentum) {
                    var absorbThis = groups.splice(i+1, 1)[0];
                    groups[i].moveToAndAbsorb(absorbThis);
                    len--;
                    if(absorbThis.averageMomentum != 0) groupsToMove--;
                  } else {
                    groups[i].reachEquilibrium();
                    groupsToMove--;
                  }
                }

              }


            }

            if(toHighlight.length > 0) {
              var now = (new Date()).getTime(),
                rateLimit = $.browser.webkit ? 40 : 110;
              if(!self.lastHighlightAt) self.lastHighlightAt = 0;
              if(now - self.lastHighlightAt < rateLimit) {
                return;
              } else {
                self.lastHighlightAt = now;
                $.each(groups,function(p,r){
                  $.each(this.items,function(i) {
                    this.plot.highlightPoint(this.point, r.top+i*labelHeight);
                  });
                })
              }
            }

          } else {
            self.removeHighlightPoints();
          }

        });
      }
     
      return _canvas;
    }
   
    //
    // accessor
    //
    self.options = function( set_options ) {
      if ( arguments.length ) { _options = set_options; }
      return _options;
    }

    //
    // accessor
    //
    self.no_hover = function( set_no_hover ) {
      if ( arguments.length ) { _no_hover = set_no_hover; }
      return _no_hover;
    }

    //
    // accessor
    //
    self.x_axis_interval = function( set_x_axis_interval ) {
      if ( arguments.length ) { _x_axis_interval = set_x_axis_interval; }
      return _x_axis_interval;
    }
   
    //
    // accessor
    //
    self.x_axis_label_formatter = function( set_x_axis_label_formatter ) {
      if ( arguments.length ) { 
        _x_axis_label_formatter = Graphy.util.function_by_name_or_function( set_x_axis_label_formatter, Graphy.formatters ); 
      }
      return _x_axis_label_formatter;
    }
   
    //
    // accessor
    //
    self.x_axis_renderer = function( set_x_axis_renderer ) {
      if ( arguments.length ) {
        _x_axis_renderer = Graphy.util.function_by_name_or_function( set_x_axis_renderer, Graphy.renderers.axis ); 
      }
      return _x_axis_renderer;
    }
   
    //
    // accessor
    //
    self.y_axis_renderer = function( set_y_axis_renderer ) {
      if ( arguments.length ) {
        _y_axis_renderer = Graphy.util.function_by_name_or_function( set_y_axis_renderer, Graphy.renderers.axis );
      }
      return _y_axis_renderer;
    }
   
    //
    // accessor
    //
    self.v_rule_label = function( set_v_rule_label ) {
      if ( arguments.length ) { _v_rule_label = set_v_rule_label; }
      return _v_rule_label;
    }
   
    //
    // read-only accessor
    //
    self.$canvas = function() {
      return _$canvas;
    }
   
    //
    // read-only accessor for the canvas' context
    //
    self.ctx = function() {
      return _ctx;
    }
   
    //
    // read-only accessor
    //
    self.index = function() {
      return _index;
    }
   
    //
    // read-only accessor
    //
    self.value_rect = function() {
      return Graphy.util.create_rect(_value_rect);
    }
   
    //
    // read-only accessor
    //
    self.value_rect_by_unit = function(key) {
      return Graphy.util.create_rect( _value_rect_by_unit[key] );
    }
   
    //
    // Checks to see if "renderer" will be used in _any_ of the plots
    //
    self.uses_renderer = function(needle_renderer) {
      var options, renderer;
      needle_renderer = Graphy.util.function_by_name_or_function( needle_renderer, Graphy.renderers, Graphy.renderers.plot );
     
      // global options
      if ( Graphy.util.function_by_name_or_function( _options.renderer, Graphy.renderers, Graphy.renderers.plot ) == needle_renderer ) { return true; }
     
      // each plot
      for ( var i = 0; i < _plots.length; i++ ) {
        renderer = Graphy.util.function_by_name_or_function( _plots[i].options.renderer, Graphy.renderers, Graphy.renderers.plot );
        if ( renderer == needle_renderer ) { return true; }
      }
     
      return false;
    }
   
    //
    // axis may be either "x" or "y". anything else will result in a combined object
    //
    // read-only accessor. units array will contain an object like {label: "cm", color: "red"}
    //
    self.units = function(axis) {
      if (axis == "x") {
        return _x_units;
      } else if (axis=="y") {
        return _y_units;
      } else {
        return $.merge( $.merge([], _y_units), _x_units );
      }
    }
   
    //
    // read-only accessor. units array will contain an object like {label: "cm", color: "red"}
    //
    self.y_units = function() {
      return _y_units;
    }
   
    //
    // read-only accessor. units array will contain an object like {label: "cm", color: "red"}
    //
    self.x_units = function() {
      return _x_units;
    }
   
    //
    // read-only accessor
    //
    self.graph_rect = function() {
      return _graph_rect;
    }
   
    //
    // read-only accessor
    //
    self.first_plot = function() {
      return _plots[0];
    }
   
    //
    // read-only accessor
    //
    self.last_plot = function() {
      return _plots[_plots.length-1];
    }
   
    //
    // read-only accessor
    //
    self.has_selected_items = function() {
      return _selected_plot_count > 0;
    }
   
    //
    // Removes all plots and redraws (blank)
    //
    self.clear = function() {
      self.removeHighlightPoints();     	

      _plots = [];
      _value_rect = false;
      _x_units = [];
      _y_units = [];
      _selected_plot_count = 0;
      self.no_hover(true);
     
      _value_rect_by_unit = {};
      self.draw();
    }
   
    //
    // Plots a data series. This is probably what you are looking for. Data can either be an
    // array series or a hash formatted { data: [[x,y]...], options: {} }. If data is not a 2d array
    // it will be converted to one with the x being the array index.
    //
    self.plot = function(data, options) {
      if ( data.constructor != Array ) {
        options = data['options'];
        data = data['data'];
      }
      data = data.sort(function(a,b){ return (a[0] - b[0]); });//sort by x-axis value ascending
      options = $.extend( {}, _options, options );
     
      for ( var i = 0, len = data.length; i < len; i++ ) {
        if ( data[i].constructor != Array ) { data[i] = [ _x_axis_interval ? _x_axis_interval * i : i, data[i] ]; }
       
        var dp = data[i];
        if(dp[0] === null || dp[0] === undefined || dp[1] === null || dp[1] === undefined) continue;

        if ( dp[0].constructor == Date ) { dp[0] = dp[0].getTime(); }
        if ( dp[1].constructor == Date ) { dp[1] = dp[1].getTime(); }
       
        if ( options['x_offset'] ) { dp[0] += ( options['x_offset'].constructor == Date ? options['x_offset'].getTime() : options['x_offset'] ); }
       
        //
        // Find mins an maxs
        //
        if ( !_value_rect ) {
          _value_rect = Graphy.util.create_rect( {left: dp[0], right: dp[0], bottom: dp[1], top: dp[1]} );
        } else {
          _value_rect.recalculate_with_point( dp );
        }
       
        var y_unit_option = options['unit'] || options['y_unit'];
        if ( y_unit_option ) {
          if ( !_value_rect_by_unit[y_unit_option] ) { 
            _value_rect_by_unit[y_unit_option] = Graphy.util.create_rect( {left: dp[0], right: dp[0], bottom: dp[1], top: dp[1]} );
            _y_units.push( {"label": y_unit_option, "color": options['color']} );
          } else {
            _value_rect_by_unit[y_unit_option].recalculate_with_point( dp );
          }
        }
       
        if ( options['x_unit'] ) {
          if ( !_value_rect_by_unit[options['x_unit']] ) { 
            _value_rect_by_unit[options['x_unit']] = Graphy.util.create_rect( {left: dp[0], right: dp[0], bottom: dp[1], top: dp[1]} );
            _x_units.push( {"label": options['x_unit'], "color": options['color']} );
          } else {
            _value_rect_by_unit[options['x_unit']].recalculate_with_point( dp );
          }
        }
       
      }

      // Each rect width should be the same to prevent misalignment along the x-axis.
      if(_.size(_value_rect_by_unit)) {
        var leftMost = _.min(_value_rect_by_unit, function(rect){ return rect.left }).left;
        var rightMost = _.max(_value_rect_by_unit, function(rect){ return rect.right }).right;
        _.each(_value_rect_by_unit, function(rect){
          rect.left = leftMost;
          rect.right = rightMost;
        });
      }

      if ( options['force_zero'] || Graphy.util.function_by_name_or_function( options['renderer'], Graphy.renderers ) == Graphy.renderers.bar  ) { // merged options
        if ( _value_rect_by_unit[y_unit_option].top < 0 ) { _value_rect_by_unit[y_unit_option].top = 0; }
        if ( _value_rect_by_unit[y_unit_option].bottom > 0 ) { _value_rect_by_unit[y_unit_option].bottom = 0; }
        if ( _value_rect.top < 0 ) { _value_rect.top = 0; }
        if ( _value_rect.bottom > 0 ) { _value_rect.bottom = 0; }
      }
           
      var p = this.newPlotObject({ "data": data, "options": options, graphy: self });
      p.draw = function() { self.draw(); return p; };
      p.remove = function() { return self.remove_plot(p); };
      p.select = function() { 
        if ( !p.options['selected'] ) {
          p.options['selected'] = true; 
          _selected_plot_count++;
        }
        self.draw(); 
        return p; 
      };
      p.unselect = p.deselect = function() { 
        if ( p.options['selected'] ) {
          p.options['selected'] = false; 
          _selected_plot_count--;
        }
        self.draw(); 
        return p; 
      };

      // only enable hover if a non-bar graph has been added.  hover is disabled when the graph is cleared and this is where it eventually gets enabled.
      if(!spec.no_hover && Graphy.util.function_by_name_or_function( options['renderer'], Graphy.renderers ) != Graphy.renderers.bar) {
        self.no_hover(false);
      }
     
      _plots.push( p );
     
      return p;
    }

    // FIXME: do we want to do this differently? perhaps a prototype plot object that we can do new Graphy.Plot()
    self.newPlotObject = function(opts) {
      var p = {
        valueRect: function() {
          return this.options['unit'] ? this.graphy.value_rect_by_unit(this.options['unit']).nice_rect : this.graphy.value_rect().nice_rect;
        },
        fromDocumentPixelToPlotPoint: function(documentPixel) {
          var graphRectPixel = this.graphy.fromDocumentPixelToGraphRectPixel(documentPixel);

          var value_rect = this.valueRect(),
            x = Graphy.util.apply_value_to_new_ratio(graphRectPixel.x, _graph_rect.left, _graph_rect.right, value_rect.left, value_rect.right),
            y = Graphy.util.apply_value_to_new_ratio(graphRectPixel.y, _graph_rect.bottom, _graph_rect.top, value_rect.top, value_rect.bottom, true);

          return {x:x, y:y};
        },
        fromPlotPointToDocumentPixel: function(plotPoint) {
          var value_rect = this.valueRect(),
            x = Graphy.util.apply_value_to_new_ratio(plotPoint.x, value_rect.left, value_rect.right, _graph_rect.left, _graph_rect.right),
            y = Graphy.util.apply_value_to_new_ratio(plotPoint.y, value_rect.top, value_rect.bottom, _graph_rect.bottom, _graph_rect.top, true);

          return this.graphy.fromGraphRectPixelToDocumentPixel({x:x,y:y});
        },
        removeHighlightPointIfExists: function() {
          if(this.highlightedPoint) {
            if(this.highlightedPoint.element) this.highlightedPoint.element.remove();
            if(this.highlightedPoint.arrowElement) this.highlightedPoint.arrowElement.remove();
            delete this.highlightedPoint;
          }
        },
        highlightPoint: function(point, topDocumentPixelPosition) {

          //TODO: need to check if its in the exact perfect position
          // target point is already highlighted, so dont do anything
          //if(this.highlightedPoint && this.highlightedPoint.point == point) return;

          this.removeHighlightPointIfExists();

          var pixel = this.fromPlotPointToDocumentPixel({x:point[0],y:point[1]}),
            highlightEstimatedHeight = 20,
            defaultTop = pixel.y-highlightEstimatedHeight/2,
            highlightTop = topDocumentPixelPosition;


          var labelOffset = highlightTop - defaultTop,
            labelOffsetAbs = Math.abs(labelOffset),
            arrowWidth = 30,
            arrowHeight = 8,
            $c = $.createCanvas(arrowWidth, (arrowHeight + labelOffsetAbs)).css({position:'absolute','z-index':1001}),
            c = $c.get(0);

          var ctx = c.getContext('2d');

          // set up the label and build it
          var label,
    	      x_display_point = Math.round(point[0] * 100)/100,
    	      y_display_point = Math.round(point[1] * 100)/100;
    
          if(this.options.unit) {
            label = y_display_point + ' ' + this.options.unit + ' @ ' + Graphy.formatters.human_date(x_display_point);
          } else {
            label = 'x: ' + x_display_point + ', y: ' + y_display_point;
          }

          if(this.options.dataSourceAndTypeLabel){
            label += " - " + this.options.dataSourceAndTypeLabel;
          }
         
          this.highlightedPoint = {
            point: point,
            arrowElement: $c,
            element: $('<div class="graphy_point_label">' + label + '</div>')
                       .css('background-color', this.options.color || 'gray')
                       .css('z-index', 1001)
                       .prependTo('body')
                       .addClass('graphy')
          }
         
          // figure out if we need to draw it on the left or not
          var $gCanvas = $(this.graphy.canvas()),
            gRight = $gCanvas.offset().left + $gCanvas.width(),
            allowedLabelWidth = 250,
            xTransform,
            arrowLeft,
            labelLeft,
            showOnLeft = gRight < pixel.x + allowedLabelWidth;
          // deal with displaying the label and arrow on either the left or the right side by setting left offset positions and an optional x coord transform
          if(showOnLeft) {
            xTransform = function(x) { return -x + arrowWidth; }
            arrowLeft = pixel.x - arrowWidth;
            labelLeft = pixel.x - arrowWidth - this.highlightedPoint.element.outerWidth();
          } else { 
            xTransform = function(x) { return x; }
            arrowLeft = pixel.x;
            labelLeft = pixel.x + arrowWidth;
          }

          // if you are trying to understand this, i recommend drawing a picture
          var cOffsetTop;
          ctx.lineWidth = 2;
          if(labelOffset <= 0) {
            ctx.moveTo(xTransform(0), arrowHeight/2 + labelOffsetAbs);
            ctx.lineTo(xTransform(arrowWidth), 0);
            ctx.lineTo(xTransform(arrowWidth), arrowHeight);
            cOffsetTop = highlightTop + (highlightEstimatedHeight - arrowHeight)/2;
          } else {
            var overlapNudge = arrowHeight/2 - labelOffsetAbs;
            ctx.moveTo(xTransform(0), overlapNudge > 0 ? overlapNudge : 0);
            ctx.lineTo(xTransform(arrowWidth), overlapNudge > 0 ? 0 : labelOffsetAbs - arrowHeight/2);
            ctx.lineTo(xTransform(arrowWidth), overlapNudge > 0 ? arrowHeight : labelOffsetAbs + arrowHeight/2);
            cOffsetTop = highlightTop - (labelOffset - arrowHeight/2) + (highlightEstimatedHeight - arrowHeight)/2;
            if(overlapNudge > 0) cOffsetTop -= overlapNudge;
          }
          ctx.fillStyle = this.options.color || 'gray';
          ctx.fill();

          this.highlightedPoint.element.offset({top: highlightTop, left: labelLeft});
          $c.prependTo('body').addClass('graphy').offset({left: arrowLeft, top: cOffsetTop});
        }
      }
      return $.extend(p, opts);
    };
   
    //
    // Remove the plot, specified by plot reference or index.
    //
    self.remove_plot = function( plot_or_index ) {
      var p, i; 
      if ( plot_or_index.constructor == Number ) {
        i = plot_or_index;
        p = _plots[i]
      } else {
        p = plot_or_index;
        i = $.inArray(p, _plots);
      }
      // TODO: update no_hover() here. it does not appear that this function is being used.
     
      return _plots.splice(i,1)[0];
    }
   
    //
    // plots an array of plots. see plot for hash format.
    //
    self.plots = function(plot_array, options) {
      if ( plot_array ) {
        for ( var i = 0; i < plot_array.length; i++ ) {
          self.plot(plot_array[i], options);
        }
      }
     
      return _plots;
    }

    //
    //this helper just returns just the bar plots
    //
    self.barPlots = function(){
      return _.select(_plots, function(p){ return p.options.renderer == 'bar'; })
    }
   
    //
    //this helper returns the number of points in the plot with the most points
    //
    self.maxNumBarsInPlot = function(){
      return _.max(self.barPlots(), function(p){ return p.data.length; }).data.length
    }
   
    //
    // plots based on a json hash (single plot) or array (multiple plots). see plot for hash format.
    //
    self.plot_json = function(json) {
      try {
        var obj = $.parseJSON(json);
      } catch(err) {
        console.warn(err, json);
        return self;
      }
     
      if ( obj ) {
        if ( obj.constructor != Array ) { obj = [obj]; }
        self.plots( obj );
      }
     
      return _plots;
    }
   
    //
    // getter/setter for max_x/y
    //
    self.max = function(axis_name, val) {
      if ( val != null ) { axis_name == 'x' ? _value_rect.right = val : _value_rect.top = val; }
      return axis_name == 'x' ? _value_rect.right : _value_rect.top;
    }
   
    //
    // getter/setter for min_x/y
    //
    self.min = function(axis_name, val) {
      if ( val != null ) { 
        axis_name == 'x' ? _value_rect.left = val : _value_rect.bottom = val; 
      }
      return axis_name == 'x' ? _value_rect.left : _value_rect.bottom;
    }
   
    init(spec);
    return self;
  }
}
