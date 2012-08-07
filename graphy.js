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
Graphy.filters = {
  // The CUSUM (or cumulative sum control chart) is used for
  // monitoring change detection. It involves the calculation of a
  // cumulative sum; the sum itself is the sum of differences
  // between points in an actual data set, and a data set with
  // target values.
  //
  // target - An Array of Arrays where each sub Array has
  //                the structure of [time, value]. These sub
  //                Arrays should be sorted by time.
  // actual - Ditto.
  //
  // Returns a data set with a structure identical to those of
  // the parameters, but each value is the CUSUM at that time.
  cusum: function(target, actual) {
    var series = []
      , cusum = 0
      , i = 0
      , j = 0;

    while (i < actual.length) {
      if (actual[i][0] < target[j][0]) {
        i++;
      } else if (actual[i][0] > target[j][0]) {
        j++;
      } else {
        cusum += (actual[i][1] - target[j][1]);
        series.push([actual[i][0], cusum]);
        i++; j++;
      }
    }

    return series;
  }
}
Graphy.formatters = {
 
  human_date: function(val, precision) {
    var date = new Date(val);
    precision = precision || 1;
   
    if ( isNaN( date.getTime() ) ) {
      val = "";
    } else if ( precision < Graphy.interval.month && date.getHours() == 12 && date.getMinutes() == 0 ) {
      val = "noon";
    } else if ( precision < Graphy.interval.month && date.getHours() || date.getMinutes() || date.getSeconds()  ) {
      var suffix = "am";
      var hours = date.getHours();
      if ( hours >= 12 ) { 
        suffix = "pm";
        if ( hours > 12 ) {
          hours -= 12;
        }
      } else if ( hours == 0 ) {
        hours = 12;
      }
      var minutes = date.getMinutes();
      if ( minutes < 10 ) { minutes = "0" + minutes; }
      val = hours + ":" + minutes + suffix;
    } else if ( precision < Graphy.interval.month && date.getDate() ) {
      var suffix = ( Math.floor( ( date.getDate() % 100 ) / 10 ) == 1 ) ? "th" : ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"][date.getDate()%10];
      val = Graphy.formatters.months[ date.getMonth() ] + " " + date.getDate() + suffix;
    } else {
      val = Graphy.formatters.months[ date.getMonth() ] + " " + date.getFullYear();
    }
   
    return val;
  },
 
  none: function(val, precision){ return "" },
 
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] 
}
Graphy.interval = {
  second: 1000,
  minute: 60000,
  hour: 60000 * 60,
  day: 60000 * 60 * 24,
  week: 60000 * 60 * 24 * 7,
  month: 60000 * 60 * 24 * 28,
  year: 60000 * 60 * 24 * 365,
 
  ms_to_s: function(ms) {
    var s = "";
   
    switch (ms) {
     case Graphy.interval.second: s = "second"; break;
     case Graphy.interval.minute: s = "minute"; break;
     case Graphy.interval.hour: s = "hour"; break;
     case Graphy.interval.day: s = "day"; break;
     case Graphy.interval.week: s = "week"; break;
     case Graphy.interval.month: s = "month"; break;
     case Graphy.interval.year: s = "year"; break;
    }
   
    return s;
  },
 
  floor: function(ms, step_interval) {
    var d = new Date(ms);
   
    if (step_interval > Graphy.interval.second) { d.setSeconds(0); }
    if (step_interval > Graphy.interval.minute) { d.setMinutes(0); }
    if (step_interval > Graphy.interval.hour) { d.setHours(0); }
    if (step_interval > Graphy.interval.day) { d.setDate(1); }
    if (step_interval > Graphy.interval.month) { d.setMonth(0); }
   
    return d;
  },
 
  step_date: function(ms, step_interval, increment) {
    increment || (increment = 1);
   
    switch ( step_interval ) {
      case Graphy.interval.day:
        getSetFuncName = "Date";
        break;
      case Graphy.interval.month:
        getSetFuncName = "Month";
        break;
      case Graphy.interval.year:
        getSetFuncName = "FullYear";
        break;
      default:
        // nothing
    }
   
    if ( getSetFuncName ) {
      var d = new Date(ms), getSetFuncName;
      d["set"+getSetFuncName]( d["get"+getSetFuncName]() + increment );
      d.setHours(0); d.setMinutes(0); d.setSeconds(0);
      ms = d.getTime();
    } else {
      ms += step_interval * increment;
    }
   
    return ms;
  },
 
  bigger_interval: function( interval ) {
    var sorted_list = [Graphy.interval.second, Graphy.interval.minute, Graphy.interval.hour, Graphy.interval.day, Graphy.interval.month, Graphy.interval.year]
   
    for ( var i = 0; i < sorted_list.length; i++ ) {
      if ( interval < sorted_list[i] ) { return sorted_list[i]; }
    }

    return Graphy.interval.year;
  }
}
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

Graphy.util = {
 
  apply_value_to_new_ratio: function( val, old_min, old_max, new_min, new_max, flipped ) {
    var ret;
   
    if ( old_min == old_max || new_min == new_max ) { 
      ret = 0; 
    } else {
      ret = (new_max - new_min)/(old_max-old_min) * (val - old_min);
    }
   
    return flipped ? (new_max - new_min) - ret + new_min : ret + new_min;
  },
   
  create_rect: function(rect) {
    var new_rect = { top: rect && rect.top ? rect.top : 0,
      right: rect && rect.right ? rect.right : 0,
      bottom: rect && rect.bottom ? rect.bottom : 0,
      left: rect && rect.left ? rect.left : 0,
      height: function() { return Math.abs(this.bottom - this.top) },
      width: function() { return Math.abs(this.right - this.left) },
      nice_rect: false,
      recalculate_with_point: function(pt) { // param is 2 dimensional array [x,y]
        if ( pt[0] < new_rect.left ) { new_rect.left = pt[0]; }
        if ( pt[0] > new_rect.right ) { new_rect.right = pt[0]; }
        if ( pt[1] < new_rect.bottom ) { new_rect.bottom = pt[1]; }
        if ( pt[1] > new_rect.top ) { new_rect.top = pt[1]; }
        new_rect.recalculate_nice_rect();
      },
      recalculate_nice_rect: function() {
        new_rect.nice_rect = $.extend({}, new_rect);
        new_rect.nice_rect.bottom = Graphy.util.nice_num(new_rect.bottom, true);
        new_rect.nice_rect.top = Graphy.util.nice_num(new_rect.top);

        if(new_rect.nice_rect.top == new_rect.nice_rect.bottom){
 	  new_rect.nice_rect.top = new_rect.nice_rect.bottom + 1;
	}  
      },
      to_s: function() {
        return "{top:" + this.top + ", bottom:" + this.bottom + ", left:" + this.left + ", right:" + this.right + "}";
      }
    };
   
    new_rect.recalculate_nice_rect();
   
    return new_rect;
  },
 
  function_by_name_or_function: function( name_or_function, pkg, default_function ) {
    var func;
   
    if ( name_or_function && name_or_function.constructor == Function ) {
      func = name_or_function;
    } else if ( name_or_function && name_or_function.constructor == String ) {
      func = pkg[name_or_function];
    } else {
      func = default_function || null;
    }
   
    return func;
  },
 
  nice_num: function( n, go_down ) {
    var signed = n < 0;
    n = Math.abs(n);
   
    var exponent = Math.floor( Math.log(n)/Math.LN10 );
    var frac = n/Math.pow(10,exponent);
  
    var nice_frac = 10;
    var nice_fracs = [ 0, 0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9, 1.0 ];
    var whole_num = Math.floor(frac);
   
    for ( var i = 0; i < nice_fracs.length; i++ ) {
      if ( ( go_down || signed ) && !( go_down && signed )  ) { // XOR
        if ( frac >= whole_num + nice_fracs[i] ) { nice_frac = whole_num + nice_fracs[i]; break; }
      } else {
        if ( frac <= whole_num + nice_fracs[i] ) { nice_frac = whole_num + nice_fracs[i]; break; }
      }
    }
   
    return nice_frac * Math.pow(10,exponent) * ( signed ? -1 : 1);
  },

  calculatePrecision: function (low, high) {
    var precision, distance = Math.abs(high - low);
 
    if (distance == 0) precision = 1
    else {
      precision = Math.max(0, Math.ceil(Math.log(distance) / Math.log(10))); //sigfigs before decimal
      if (precision < 5) precision += Math.max(2, (-1 * Math.floor(Math.log(distance) / Math.log(10))) + 2); //sigfigs after
    }
    return precision;
  }
}
Graphy.renderers = {
 
  v_rule: function(value, precision, graph) {
    var ctx = graph.ctx(), value_rect = graph.value_rect(), graph_rect = graph.graph_rect();
    ctx.save();
   
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#ccc";
   
    x = Math.round(Graphy.util.apply_value_to_new_ratio(value, value_rect.left, value_rect.right, graph_rect.left, graph_rect.right)) - 0.5;
   
    for ( var y = 0; y < graph_rect.bottom - 2; y+=4 ) {
      ctx.moveTo( x, y );
      ctx.lineTo( x, y + 2 );
    }
   
    ctx.stroke();      
    ctx.restore();
   
    if ( graph.v_rule_label() ) {
      // FIXME: label should not be in the axis module at this point
      Graphy.renderers.axis.label( Graphy.formatters.human_date(value, precision),
        x + 15, 
        57, 
        graph,
        "graphy_v_rule_label", 
        null,
        "left" );
    }
  },
 
  plot: function(index, data, options, graph) {
    var ctx = graph.ctx(), 
        value_rect = options['unit'] ? graph.value_rect_by_unit(options['unit']).nice_rect : graph.value_rect().nice_rect,
        graph_rect = graph.graph_rect(),
        x,
        y;
   
    ctx.save();
   
    var fill = options.color || "gray";
    ctx.lineWidth = options.width || 1;
   
    for ( var j = 0; j < data.length; j++ ) {
      x = Math.round( Graphy.util.apply_value_to_new_ratio(data[j][0], value_rect.left, value_rect.right, graph_rect.left, graph_rect.right) );
      y = Math.round( Graphy.util.apply_value_to_new_ratio(data[j][1], value_rect.bottom, value_rect.top, graph_rect.top, graph_rect.bottom, true) );
     
      ctx.fillStyle = fill;
      ctx.fillRect(x-2, y-2, 3, 3);
      ctx.fillStyle = "#fff";
      ctx.fillRect(x-1, y-1, 1, 1);
    }
   
    ctx.restore();
  },
 
  line: function(index, data, options, graph) {
    if ( data.length == 1 ) {
      return Graphy.renderers.plot( index, data, options, graph );
    }
   
    var ctx = graph.ctx(), 
        value_rect = options['unit'] ? graph.value_rect_by_unit(options['unit']).nice_rect : graph.value_rect().nice_rect, 
        graph_rect = graph.graph_rect(),
        x,
        y,
        rgb = Rico.Color.create(options.color || "gray").rgb,
        alpha = !graph.has_selected_items() || options['selected'] ? 1 : 0.2;
   
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = 'rgba('+rgb.r+', '+rgb.g+', '+rgb.b+', '+alpha+')';
    ctx.lineWidth = options.width || 1;
   
    for ( var j = 0; j < data.length; j++ ) {
      x = Graphy.util.apply_value_to_new_ratio(data[j][0], value_rect.left, value_rect.right, graph_rect.left, graph_rect.right) + 0.5;
      y = Graphy.util.apply_value_to_new_ratio(data[j][1], value_rect.bottom, value_rect.top, graph_rect.top, graph_rect.bottom, true) + 0.5;
      j ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
    }
    ctx.stroke();
   
    ctx.restore();
  },
 
  bar: function(index, data, options, graph) {
    var ctx = graph.ctx(),
        value_rect = options['unit'] ? graph.value_rect_by_unit(options['unit']).nice_rect : graph.value_rect().nice_rect, 
        graph_rect = graph.graph_rect(),
        x,
        y,
        zero_y = Graphy.util.apply_value_to_new_ratio(0, value_rect.bottom, value_rect.top, graph_rect.top, graph_rect.bottom, true),
        h,
        maxW = _.min([60, Math.floor((graph.graph_rect().right - graph.graph_rect().left) / (graph.maxNumBarsInPlot()))]),//how wide a bar slot can be
        w = _.max([1, Math.floor(maxW / graph.barPlots().length)-1]),//width of the bar
        top_color = options['color'] || "gray",
        bottom_color = top_color,
        gradient,
        alpha = !graph.has_selected_items() || options['selected'] ? 1 : 0.2;

    var precision = Graphy.util.calculatePrecision(value_rect.bottom, value_rect.top)

    bottom_rgb = Rico.Color.create(top_color).darken(.1).rgb;
    top_rgb = Rico.Color.create(top_color).brighten(.05).rgb;

    ctx.save();
    ctx.beginPath();
   
    for ( var j = 0; j < data.length; j++ ) {
      x = Math.round( Graphy.util.apply_value_to_new_ratio(data[j][0], value_rect.left, value_rect.right, graph_rect.left, graph_rect.right)) - Math.ceil(maxW/2) + ((w+1) * (index-1));//indexed is 1 based
      y = Math.round( Graphy.util.apply_value_to_new_ratio(data[j][1], value_rect.bottom, value_rect.top, graph_rect.top, graph_rect.bottom, true) );
      h = zero_y - y;
         
      gradient = ctx.createLinearGradient(x, y, x, y + h);
      gradient.addColorStop(0, 'rgba('+top_rgb.r+', '+top_rgb.g+', '+top_rgb.b+', '+alpha+')');
      gradient.addColorStop(0.5, 'rgba('+bottom_rgb.r+', '+bottom_rgb.g+', '+bottom_rgb.b+', '+alpha+')');
      ctx.fillStyle = gradient;
      ctx.fillRect( x, y, w, h );
     
      // label
      // FIXME: refactor so this is not in the axis package
      if (w > 30) {
          Graphy.renderers.axis.label( data[j][1].toPrecision(precision), x + w/2, y - 12, graph, "graphy_bar_label", null, "center", top_color, alpha );
      }
    }
   
    ctx.restore();
  },
 
  axis: {
   
    none: function(action, graph) {
      return graph.graph_rect();
    },
   
    //
    // just the facts (text)
    //
    clean_x: function(action, graph) {
      var $canvas = graph.$canvas(), 
          ctx = graph.ctx(), 
          value_rect = graph.value_rect().nice_rect, 
          graph_rect = graph.graph_rect(), 
          x_axis_interval = graph.x_axis_interval(),
          x_axis_label_formatter = graph.x_axis_label_formatter();
     
      if ( action == "measure" ) {
        graph_rect.bottom = $canvas.height() - 24 - ( graph.x_units().length ? 20 : 0 );
        graph_rect.right = $canvas.width() - 14;
      } else {
        var number_of_labels = Math.max( Math.floor( ( graph_rect.right - graph_rect.left ) / 140 ) + 1, 2 );
        Graphy.renderers.axis.x_value_labels( number_of_labels, 0, graph_rect.bottom + 10, "graphy_axis_line_x_value_label", "center", graph );
        Graphy.renderers.axis.unit_labels( "x", graph );
      }

      return graph_rect;
    },
   
    //
    // text with a horizontal bottom line
    //
    line_x: function(action, graph) {
      var $canvas = graph.$canvas(), 
          ctx = graph.ctx(), 
          value_rect = graph.value_rect().nice_rect, 
          graph_rect = graph.graph_rect(), 
          x_axis_interval = graph.x_axis_interval(),
          x_axis_label_formatter = graph.x_axis_label_formatter();
     
      if ( action == "measure" ) {
        graph_rect.bottom = $canvas.height() - 24 - ( graph.x_units().length ? 20 : 0 );
        graph_rect.right = $canvas.width() - 14;
      } else {
        ctx.save();
     
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.strokeStyle = "#ddd";
        ctx.moveTo(graph_rect.left - 16.5, graph_rect.bottom - 0.5);
        ctx.lineTo($canvas.width(), graph_rect.bottom - 0.5);
        ctx.stroke();
     
        ctx.restore();
     
        var number_of_labels = Math.max( Math.floor( ( graph_rect.right - graph_rect.left ) / 72 ) + 1, 2 );
        Graphy.renderers.axis.x_value_labels( number_of_labels, 0, graph_rect.bottom + 10, "graphy_axis_line_x_value_label", "center", graph );
        Graphy.renderers.axis.unit_labels( "x", graph );
      }
     
      return graph_rect;
    },
   
    //
    // simple horizontal line with ticks for each plot.
    //
    scatter_x: function(action, graph) {
      var $canvas = graph.$canvas(), 
          ctx = graph.ctx(), 
          value_rect = graph.value_rect().nice_rect, 
          graph_rect = graph.graph_rect(), 
          x_axis_interval = graph.x_axis_interval(),
          x_axis_label_formatter = graph.x_axis_label_formatter();
     
      if ( action == "measure" ) {
        graph_rect.bottom = $canvas.height() - 24 - ( graph.x_units().length ? 20 : 0 );
        graph_rect.right = $canvas.width() - 14;
      } else {
        // kick off drawing
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#ddd";        
       
        // long axis line
        ctx.beginPath();
        ctx.moveTo(graph_rect.left - 1, graph_rect.bottom + 16.5);
        ctx.lineTo(graph_rect.right + 1, graph_rect.bottom + 16.5);
        ctx.stroke();
       
        // labels
        var number_of_labels = Math.max( Math.floor( ( graph_rect.right - graph_rect.left ) / 72 ) + 1, 2 );
        Graphy.renderers.axis.x_value_labels( number_of_labels, 0, graph_rect.bottom + 18, "graphy_axis_line_x_value_label", "center", graph );
        Graphy.renderers.axis.unit_labels( "x", graph );
       
        // finish drawing
        ctx.restore();
       
        Graphy.renderers.axis.scatter_ticks(graph);
      }
     
      return graph_rect;
    },
   
    //
    // simple horizontal lines with a dark bottom line
    //
    clean_y: function(action, graph) {
      var $canvas = graph.$canvas(), 
          ctx = graph.ctx(), 
          value_rect = graph.value_rect().nice_rect, 
          graph_rect = graph.graph_rect(),
          axis_pad = graph.y_units().length ? 24 : 0;     
     
      if ( action == "measure" ) {
        graph_rect.left = axis_pad;
        graph_rect.top = 16;
      } else {
        ctx.save();
        ctx.lineWidth = 1;
 
        var number_of_lines = Math.max( Math.floor( ( graph_rect.bottom - graph_rect.top ) / 70 ) + 1, 3 );
        var h, round_h;
 
        for ( var i = 0; i < number_of_lines; i++ ) {
          h = graph_rect.bottom - ( i * ( ( graph_rect.bottom - graph_rect.top ) / ( number_of_lines - 1 )  ) );
          round_h = Math.round(h);
          ctx.beginPath();
          ctx.strokeStyle = i ? "#f0f0f0" : "#ddd";
          ctx.moveTo(axis_pad + 3, round_h - 0.5);
          ctx.lineTo($canvas.width(), round_h - 0.5);
          ctx.stroke();
        }
 
        // labels
        Graphy.renderers.axis.y_value_labels( number_of_lines, 4, -14, "graphy_axis_clean_y_value_label", "left",  graph );
        Graphy.renderers.axis.unit_labels( "y", graph );
        ctx.restore();
       
        // pad in the edges a little more
        graph_rect.left += 30;
        graph_rect.right -= 30;
      }
     
      return graph_rect;
    },
   
    //
    // simple vertical line
    //
    line_y: function(action, graph) {
      var $canvas = graph.$canvas(), 
          ctx = graph.ctx(), 
          value_rect = graph.value_rect().nice_rect, 
          graph_rect = graph.graph_rect(),
          axis_pad = graph.y_units().length ? 24 : 0;
     
      if ( action == "measure" ) {
        graph_rect.left = axis_pad;
        graph_rect.top = 16;
      } else {
        // labels
        var number_of_lines = Math.max( Math.floor( ( graph_rect.bottom - graph_rect.top ) / 72 ) + 1, 3 );
        Graphy.renderers.axis.y_value_labels( number_of_lines, 0, -8, "graphy_axis_line_y_value_label", "right", graph );
        Graphy.renderers.axis.unit_labels( "y", graph );
       
        // the line
        ctx.save();

        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.strokeStyle = "#ddd";
        ctx.moveTo(graph_rect.left - 16.5, graph_rect.top - 1);
        ctx.lineTo(graph_rect.left - 16.5, graph_rect.bottom + 1);
        ctx.stroke();
       
        ctx.restore();
      }
     
      return graph_rect;
    },
   
    //
    // simple vertical line with ticks for each plot.
    //
    scatter_y: function(action, graph) {
      var graph_rect = Graphy.renderers.axis.line_y(action, graph);
     
      if ( action == "draw" ) {
        var $canvas = graph.$canvas(), 
            ctx = graph.ctx(),
            value_rect = graph.value_rect().nice_rect;
       
        // adjust for the ticks
        graph_rect.left += 8;
       
        if (graph.x_axis_renderer() != Graphy.renderers.axis.scatter_x) { Graphy.renderers.axis.scatter_ticks(graph); }
      }
     
      return graph_rect;
    },
   
    scatter_ticks: function(graph) {
      var $canvas = graph.$canvas(), 
          ctx = graph.ctx(),
          value_rect = graph.value_rect().nice_rect, 
          graph_rect = graph.graph_rect();
     
      // kick off drawing
      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#ddd";        
      ctx.beginPath();
     
      // go through all of the plots and draw a tick at each y
      var plots = graph.plots(), plots_length = plots.length, data, data_length, y;
      for ( var i = 0; i < plots_length; i++ ) {
        data = plots[i].data;
        data_length = data.length;
        for ( var j = 0; j < data_length; j++ ) {
          if (graph.y_axis_renderer() == Graphy.renderers.axis.scatter_y) {
            y = Math.floor(Graphy.util.apply_value_to_new_ratio( data[j][1], value_rect.bottom, value_rect.top, graph_rect.bottom, graph_rect.top )) - 0.5;
            ctx.moveTo(graph_rect.left - 22, y);
            ctx.lineTo(graph_rect.left - 18, y);
          }
         
          if (graph.x_axis_renderer() == Graphy.renderers.axis.scatter_x) {
            x = Math.floor(Graphy.util.apply_value_to_new_ratio( data[j][0], value_rect.left, value_rect.right, graph_rect.left, graph_rect.right )) - 0.5;
            ctx.moveTo(x, graph_rect.bottom + 14);
            ctx.lineTo(x, graph_rect.bottom + 10);
          }
        }
      }
     
      // finish drawing
      ctx.stroke();
      ctx.restore();
    },
   
    label: function(val, x, y, graph, style_name, formatter, align, color, opacity) {
      var $canvas = graph.$canvas();
      var left = Math.round($canvas.offset().left + x);
      var top = Math.round($canvas.offset().top + y);
     
      // stoopid IE6
      if ( $.browser.msie && $.browser.version.charAt(0) == "6" ) {
        top -= $(window).scrollTop();
      }

      if ( formatter ) { val = formatter(val); }
     
      $el = $("<p class='"+style_name+" graphy_axis_label graphy_axis_label_"+graph.index()+"' style='"+ ( color ? 'color:' + color + '; ' : '' ) + ( opacity ? 'opacity:' + opacity + '; ' : '' ) + "'>" + val + "</p>");
      $el.css({position:'absolute','z-index':1000}).prependTo('body').addClass('graphy');
     
      switch ( align ) {
        case "center":
          left -= $el.width()/2;
          break;
        case "vertical_center":
          top += $el.width()/2;
          break;
        case "right":
          left -= $el.width();
          break;
      }
     
      $el.offset( { top: top, left: left } );
     
      return $el;
    },
   
    //
    // param axis can be either "x" or "y"
    //
    unit_labels: function(axis, graph) {
      var units = graph.units(axis),
        $canvas = graph.$canvas(),
        unit_i = units.length, 
        axis_label = "", 
        unit, 
        open_color_tag = false;
       
      while ( unit_i-- ) {
        unit = units[unit_i];
       
        if ( unit['color'] && units.length > 1 ) { 
          axis_label += "<font style='color:"+unit['color']+"'>";
          open_color_tag = true;
        }
        axis_label += unit['label'];
        if ( open_color_tag ) { 
          axis_label += "</font>";
          open_color_tag = false;
        }
        if ( unit_i ) { axis_label += "&nbsp;&nbsp;"; }
      }
     
      if ( axis_label ) {
        if ( axis == "x" ) {
          Graphy.renderers.axis.label( axis_label, graph.graph_rect().left + (graph.graph_rect().width() / 2), graph.graph_rect().top + graph.graph_rect().height() + 40, graph, "graphy_axis_unit_label graphy_axis_x_unit_label", null, "center" );
        } else {
          Graphy.renderers.axis.label( axis_label, 0, graph.graph_rect().top + (graph.graph_rect().height() / 2), graph, "graphy_axis_unit_label graphy_axis_y_unit_label vertical_text", null, "vertical_center" );
        }
      }
    },
   
    x_value_labels: function(number_of_labels, x_offset, y_offset, style_name, align, graph) {
      var $canvas = graph.$canvas(),
          value_rect = graph.value_rect().nice_rect,
          graph_rect = graph.graph_rect(),
          x_axis_interval = graph.x_axis_interval(),
          x_axis_label_formatter = graph.x_axis_label_formatter(),
          align = align || "center",
          round_v, labels_to_draw = {};

      if ( !x_axis_interval || x_axis_interval < Graphy.interval.hour ) { x_axis_interval = Graphy.interval.hour; }

      var bigger_interval = Graphy.interval.bigger_interval(x_axis_interval);
      var left = x_axis_label_formatter == Graphy.formatters.human_date ?  Graphy.interval.floor(value_rect.left, bigger_interval).getTime() : value_rect.left;
      var labelCount = 0;
     
      if ( x_axis_interval > Graphy.interval.hour && x_axis_label_formatter == Graphy.formatters.human_date ) {
        // step by nice dates
        var step_increment = Math.ceil(((value_rect.right - value_rect.left)/x_axis_interval)/number_of_labels);
       
        for ( ms = left; 
              ms <= value_rect.right; 
              ms = Graphy.interval.step_date(ms, x_axis_interval, step_increment) ) {

          round_v = Math.round( Graphy.util.apply_value_to_new_ratio( ms, 
            value_rect.left,
            value_rect.right, 
            graph_rect.left, 
            graph_rect.right ) );

          if (round_v > 16 && !labels_to_draw[ms]) { 
            labels_to_draw[ms] = {x: round_v, text: Graphy.formatters.human_date(ms, x_axis_interval)}; 
          }
         
          labelCount++; 
        }
       
      } else {
        // raw-style 
        // first pass with the bigger interval
        if ( x_axis_label_formatter == Graphy.formatters.human_date ) {
          for ( var ms = left; 
                ms <= value_rect.right; 
                ms = Graphy.interval.step_date(ms, bigger_interval) ) {

            round_v = Math.round( Graphy.util.apply_value_to_new_ratio( ms, 
              value_rect.left,
              value_rect.right, 
              graph_rect.left, 
              graph_rect.right ) );

            if (round_v > 16) { 
              labels_to_draw[ms] = {x: round_v, text: Graphy.formatters.human_date(ms, bigger_interval)}; 
              Graphy.renderers.v_rule( ms, bigger_interval, graph );
            }
            labelCount++; // include unplotted labels
          }
        }
       
        var precision = Graphy.util.calculatePrecision(value_rect.left, value_rect.right);

        // fill in (1/2, 1/4, 1/8...) until out of labels       
        for (var jump = bigger_interval; labelCount*2-1 < number_of_labels && jump > 0; jump /= 2) {
          for ( n = left + jump; 
                n <= value_rect.right; 
                n += jump ) {
                 
            round_v = Math.round( Graphy.util.apply_value_to_new_ratio( n, 
              value_rect.left,
              value_rect.right, 
              graph_rect.left, 
              graph_rect.right ) );

            if (round_v && !labels_to_draw[n]) { 
              labels_to_draw[n] = {x: round_v, text: x_axis_label_formatter ? x_axis_label_formatter(n, x_axis_interval) : n.toPrecision(precision) }; 
              labelCount++;
            }
          }
        }
      }
     
      // actually draw them
      var last_x = -1000;
      _.each( labels_to_draw, function(label) {
        if ( label.x > last_x + 10 || label.x < last_x - 10 ) { // protect against crowding labels
          Graphy.renderers.axis.label( 
            label.text, 
            label.x + x_offset,
            y_offset, 
            graph, 
            style_name, 
            null, 
            align );
          last_x = label.x;
        }
      });        
    },
   
    y_value_labels: function(number_of_labels, x_offset, y_offset, style_name, align, graph) {
      var $canvas = graph.$canvas(),
          graph_rect = graph.graph_rect(),
          h, 
          round_h, 
          val, 
          precise, 
          precision, 
          $el, 
          array_of_$els = [],
          max_label_width, 
          x = graph_rect.left,
          y_units = graph.y_units();
     
     
      // this guy puts everything together to make an individual label
      var _y_label = function(value_rect, x, color) {
        precision = Graphy.util.calculatePrecision(value_rect.bottom, value_rect.top)

        val = Math.round( Graphy.util.apply_value_to_new_ratio( h, graph_rect.bottom, graph_rect.top, value_rect.bottom, value_rect.top ) * 100 ) / 100;

        precise = val.toPrecision(precision);

        return Graphy.renderers.axis.label( val == precise ? val : precise, x_offset + x, round_h + y_offset, graph, style_name, null, align, color );
      };
     
      // loop through the rows for each unit
      for ( var j = 0; j < (y_units.length || 1); j++ ) {
        max_label_width = 0;
       
        for ( var i = 0; i < number_of_labels; i++ ) {
          h = graph_rect.bottom - ( i * ( ( graph_rect.bottom - graph_rect.top ) / ( number_of_labels - 1 ) ) );
          round_h = Math.round(h);
         
          if ( y_units.length ) {
            $el = _y_label( graph.value_rect_by_unit(y_units[j]['label']).nice_rect, x, ( y_units.length > 1 ? y_units[j]['color'] : null ) );
          } else {
            $el = _y_label( graph.value_rect().nice_rect, x);
          }
         
          array_of_$els.push( $el );
          max_label_width = Math.max( $el.width(), max_label_width );
        }
       
        x += Math.ceil(max_label_width) + 15;
      }
     
      if ( align == "right" ) { 
        var number_of_$els = array_of_$els.length;
        for ( var k = 0; k < number_of_$els; k++ ) {
           array_of_$els[k].offset({left: array_of_$els[k].offset().left + max_label_width - 5});
        }
      }
      if ( x > graph_rect.left ) { graph_rect.left = x; }
    }  
  }
}
