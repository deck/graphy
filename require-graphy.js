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
define(function() {
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
  // xAxisInterval: Specify a fixed interval. See Graphy.interval.
  // xAxisLabelFormatter: Function or string name of function to format label text. See Graphy.formatters.
  // xAxisRenderer: Function or string name of function to render x axis. See Graphy.renderers.axis.
  //                  (default: "cleanX")
  // yAxisRenderer: Function or string name of function to render y axis. See Graphy.renderers.axis.
  //                  (default: "cleanY")
  //
  //
  createGraph: function(spec) {
    var self = {};

    // see: plot, plots, and plot_jsons for accessors
    var _plots = [];
   
    // have read/write accessors
    var _canvas,
        _yAxisRenderer, 
        _xAxisRenderer, 
        _xAxisLabelFormatter, 
        _xAxisInterval,
		    _vRuleLabel = false,
        _no_hover,
        _options = {};
       
    // have read-only accessors
    var _$canvas,
        _ctx, 
        _index = Graphy.graphs.push(self) - 1,
        _valueRect = false,
        _graphRect = false,
        _xUnits = [],
        _yUnits = [],
        _valueRectByUnit = {},
        selectedPlotCount = 0;
   
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
     
      if ( spec.xAxisInterval ) { self.xAxisInterval(spec.xAxisInterval); }
      if ( spec.xAxisLabelFormatter ) { self.xAxisLabelFormatter(spec.xAxisLabelFormatter); }
      if ( spec.xAxisRenderer ) { self.xAxisRenderer(spec.xAxisRenderer); }
      if ( spec.yAxisRenderer ) { self.yAxisRenderer(spec.yAxisRenderer); }
      if ( spec.vRuleLabel ) { self.vRuleLabel(spec.vRuleLabel); }
     
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
        if ( !_yAxisRenderer ) { _yAxisRenderer = Graphy.renderers.axis.cleanY; }
        if ( !_xAxisRenderer ) { _xAxisRenderer = Graphy.renderers.axis.cleanX; }
        _yAxisRenderer( "measure", self );
        _xAxisRenderer( "measure", self );        
        _yAxisRenderer( "draw", self );
        _xAxisRenderer( "draw", self );
       
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
          renderer = Graphy.util.functionByNameOrFunction(options.renderer, Graphy.renderers, Graphy.renderers.plot);
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

        // get the canvas context and set the graphRect initial size
        if (!_canvas.getContext) { console.warn("No canvas context found."); return; }
        _ctx = _canvas.getContext('2d');
        _graphRect = Graphy.util.createRect();
        _graphRect.right = _canvas.width - 2;
        _graphRect.bottom = _canvas.height;

        // each graph needs to watch mouse movement to check if cursor enters or leaves graph area
        // mouseover and mouseout do not work because the hover line triggers these events continually since the mouse is over that, not the graph area
        // TODO: put this code somewhere else, it should not be inlined here
        $(document).on('mousemove', function(e) {
          if(self.no_hover()) {
            return;
          }
          var o = _$canvas.offset();
          // check if cursor is inside graph area
          if(e.pageX > (o.left + _graphRect.left) && e.pageX < (o.left + _graphRect.right) && e.pageY > (o.top + _graphRect.top) && e.pageY < (o.top + _$canvas.height())) {
            // draw the hoverline if it does not exist
            if(!_hoverLine) {
              _$hoverLine = $.createCanvas(2, _graphRect.bottom).css('position', 'absolute').css('z-index', 1500),
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

              if(closeEnoughToDraw && this.options.renderer != 'bar' && (!this.graphy.hasSelectedItems() || this.options.selected)) {
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
    self.xAxisInterval = function( set_xAxisInterval ) {
      if ( arguments.length ) { _xAxisInterval = set_xAxisInterval; }
      return _xAxisInterval;
    }
   
    //
    // accessor
    //
    self.xAxisLabelFormatter = function( set_xAxisLabelFormatter ) {
      if ( arguments.length ) { 
        _xAxisLabelFormatter = Graphy.util.functionByNameOrFunction( set_xAxisLabelFormatter, Graphy.formatters ); 
      }
      return _xAxisLabelFormatter;
    }
   
    //
    // accessor
    //
    self.xAxisRenderer = function( set_xAxisRenderer ) {
      if ( arguments.length ) {
        _xAxisRenderer = Graphy.util.functionByNameOrFunction( set_xAxisRenderer, Graphy.renderers.axis ); 
      }
      return _xAxisRenderer;
    }
   
    //
    // accessor
    //
    self.yAxisRenderer = function( set_yAxisRenderer ) {
      if ( arguments.length ) {
        _yAxisRenderer = Graphy.util.functionByNameOrFunction( set_yAxisRenderer, Graphy.renderers.axis );
      }
      return _yAxisRenderer;
    }
   
    //
    // accessor
    //
    self.vRuleLabel = function( set_vRuleLabel ) {
      if ( arguments.length ) { _vRuleLabel = set_vRuleLabel; }
      return _vRuleLabel;
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
    self.valueRect = function() {
      return Graphy.util.createRect(_valueRect);
    }
   
    //
    // read-only accessor
    //
    self.valueRectByUnit = function(key) {
      return Graphy.util.createRect( _valueRectByUnit[key] );
    }
   
    //
    // Checks to see if "renderer" will be used in _any_ of the plots
    //
    self.usesRenderer = function(needle_renderer) {
      var options, renderer;
      needle_renderer = Graphy.util.functionByNameOrFunction( needle_renderer, Graphy.renderers, Graphy.renderers.plot );
     
      // global options
      if ( Graphy.util.functionByNameOrFunction( _options.renderer, Graphy.renderers, Graphy.renderers.plot ) == needle_renderer ) { return true; }
     
      // each plot
      for ( var i = 0; i < _plots.length; i++ ) {
        renderer = Graphy.util.functionByNameOrFunction( _plots[i].options.renderer, Graphy.renderers, Graphy.renderers.plot );
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
        return _xUnits;
      } else if (axis=="y") {
        return _yUnits;
      } else {
        return $.merge( $.merge([], _yUnits), _xUnits );
      }
    }
   
    //
    // read-only accessor. units array will contain an object like {label: "cm", color: "red"}
    //
    self.yUnits = function() {
      return _yUnits;
    }
   
    //
    // read-only accessor. units array will contain an object like {label: "cm", color: "red"}
    //
    self.xUnits = function() {
      return _xUnits;
    }
   
    //
    // read-only accessor
    //
    self.graphRect = function() {
      return _graphRect;
    }
   
    //
    // read-only accessor
    //
    self.firstPlot = function() {
      return _plots[0];
    }
   
    //
    // read-only accessor
    //
    self.lastPlot = function() {
      return _plots[_plots.length-1];
    }
   
    //
    // read-only accessor
    //
    self.hasSelectedItems = function() {
      return selectedPlotCount > 0;
    }
   
    //
    // Removes all plots and redraws (blank)
    //
    self.clear = function() {
      self.removeHighlightPoints();     	

      _plots = [];
      _valueRect = false;
      _xUnits = [];
      _yUnits = [];
      selectedPlotCount = 0;
      self.no_hover(true);
     
      _valueRectByUnit = {};
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
        if ( data[i].constructor != Array ) { data[i] = [ _xAxisInterval ? _xAxisInterval * i : i, data[i] ]; }
       
        var dp = data[i];
        if(dp[0] === null || dp[0] === undefined || dp[1] === null || dp[1] === undefined) continue;

        if ( dp[0].constructor == Date ) { dp[0] = dp[0].getTime(); }
        if ( dp[1].constructor == Date ) { dp[1] = dp[1].getTime(); }
       
        if ( options['xOffset'] ) { dp[0] += ( options['xOffset'].constructor == Date ? options['xOffset'].getTime() : options['xOffset'] ); }
       
        //
        // Find mins an maxs
        //
        if ( !_valueRect ) {
          _valueRect = Graphy.util.createRect( {left: dp[0], right: dp[0], bottom: dp[1], top: dp[1]} );
        } else {
          _valueRect.recalculateWithPoint(dp);
        }
       
        var yUnitOption = options['unit'] || options['yUnit'];
        if ( yUnitOption ) {
          if ( !_valueRectByUnit[yUnitOption] ) { 
            _valueRectByUnit[yUnitOption] = Graphy.util.createRect( {left: dp[0], right: dp[0], bottom: dp[1], top: dp[1]} );
            _yUnits.push( {"label": yUnitOption, "color": options['color']} );
          } else {
            _valueRectByUnit[yUnitOption].recalculateWithPoint( dp );
          }
        }
       
        if ( options['xUnit'] ) {
          if ( !_valueRectByUnit[options['xUnit']] ) { 
            _valueRectByUnit[options['xUnit']] = Graphy.util.createRect( {left: dp[0], right: dp[0], bottom: dp[1], top: dp[1]} );
            _xUnits.push( {"label": options['xUnit'], "color": options['color']} );
          } else {
            _valueRectByUnit[options['xUnit']].recalculateWithPoint( dp );
          }
        }
       
      }

      // Each rect width should be the same to prevent misalignment along the x-axis.
      if(_.size(_valueRectByUnit)) {
        var leftMost = _.min(_valueRectByUnit, function(rect){ return rect.left }).left;
        var rightMost = _.max(_valueRectByUnit, function(rect){ return rect.right }).right;
        _.each(_valueRectByUnit, function(rect){
          rect.left = leftMost;
          rect.right = rightMost;
        });
      }

      if ( options['force_zero'] || Graphy.util.functionByNameOrFunction( options['renderer'], Graphy.renderers ) == Graphy.renderers.bar  ) { // merged options
        if ( _valueRectByUnit[yUnitOption].top < 0 ) { _valueRectByUnit[yUnitOption].top = 0; }
        if ( _valueRectByUnit[yUnitOption].bottom > 0 ) { _valueRectByUnit[yUnitOption].bottom = 0; }
        if ( _valueRect.top < 0 ) { _valueRect.top = 0; }
        if ( _valueRect.bottom > 0 ) { _valueRect.bottom = 0; }
      }
           
      var p = this.newPlotObject({ "data": data, "options": options, graphy: self });
      p.draw = function() { self.draw(); return p; };
      p.remove = function() { return self.removePlot(p); };
      p.select = function() { 
        if ( !p.options['selected'] ) {
          p.options['selected'] = true; 
          selectedPlotCount++;
        }
        self.draw(); 
        return p; 
      };
      p.unselect = p.deselect = function() { 
        if ( p.options['selected'] ) {
          p.options['selected'] = false; 
          selectedPlotCount--;
        }
        self.draw(); 
        return p; 
      };

      // only enable hover if a non-bar graph has been added.  hover is disabled when the graph is cleared and this is where it eventually gets enabled.
      if(!spec.no_hover && Graphy.util.functionByNameOrFunction( options['renderer'], Graphy.renderers ) != Graphy.renderers.bar) {
        self.no_hover(false);
      }
     
      _plots.push( p );
     
      return p;
    }

    // FIXME: do we want to do this differently? perhaps a prototype plot object that we can do new Graphy.Plot()
    self.newPlotObject = function(opts) {
      var p = {
        valueRect: function() {
          return this.options['unit'] ? this.graphy.valueRectByUnit(this.options['unit']).niceRect : this.graphy.valueRect().niceRect;
        },
        fromDocumentPixelToPlotPoint: function(documentPixel) {
          var graphRectPixel = this.graphy.fromDocumentPixelToGraphRectPixel(documentPixel);

          var valueRect = this.valueRect(),
            x = Graphy.util.applyValueToNewRatio(graphRectPixel.x, _graphRect.left, _graphRect.right, valueRect.left, valueRect.right),
            y = Graphy.util.applyValueToNewRatio(graphRectPixel.y, _graphRect.bottom, _graphRect.top, valueRect.top, valueRect.bottom, true);

          return {x:x, y:y};
        },
        fromPlotPointToDocumentPixel: function(plotPoint) {
          var valueRect = this.valueRect(),
            x = Graphy.util.applyValueToNewRatio(plotPoint.x, valueRect.left, valueRect.right, _graphRect.left, _graphRect.right),
            y = Graphy.util.applyValueToNewRatio(plotPoint.y, valueRect.top, valueRect.bottom, _graphRect.bottom, _graphRect.top, true);

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
            label = y_display_point + ' ' + this.options.unit + ' @ ' + Graphy.formatters.humanDate(x_display_point);
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
    self.removePlot = function( plot_or_index ) {
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
    self.plots = function(plotArray, options) {
      if ( plotArray ) {
        for ( var i = 0; i < plotArray.length; i++ ) {
          self.plot(plotArray[i], options);
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
    self.max = function(axisName, val) {
      if ( val != null ) { axisName == 'x' ? _valueRect.right = val : _valueRect.top = val; }
      return axisName == 'x' ? _valueRect.right : _valueRect.top;
    }
   
    //
    // getter/setter for min_x/y
    //
    self.min = function(axisName, val) {
      if ( val != null ) { 
        axisName == 'x' ? _valueRect.left = val : _valueRect.bottom = val; 
      }
      return axisName == 'x' ? _valueRect.left : _valueRect.bottom;
    }
   
    init(spec);
    return self;
  }
}
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
Graphy.formatters = {
 
  humanDate: function(val, precision) {
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
Graphy.interval = {
  second: 1000,
  minute: 60000,
  hour: 60000 * 60,
  day: 60000 * 60 * 24,
  week: 60000 * 60 * 24 * 7,
  month: 60000 * 60 * 24 * 28,
  year: 60000 * 60 * 24 * 365,
 
  msToString: function(ms) {
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
 
  floor: function(ms, stepInterval) {
    var d = new Date(ms);
   
    if (stepInterval > Graphy.interval.second) { d.setSeconds(0); }
    if (stepInterval > Graphy.interval.minute) { d.setMinutes(0); }
    if (stepInterval > Graphy.interval.hour) { d.setHours(0); }
    if (stepInterval > Graphy.interval.day) { d.setDate(1); }
    if (stepInterval > Graphy.interval.month) { d.setMonth(0); }
   
    return d;
  },
 
  stepDate: function(ms, stepInterval, increment) {
    increment || (increment = 1);
   
    switch ( stepInterval ) {
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
      ms += stepInterval * increment;
    }
   
    return ms;
  },
 
  biggerInterval: function( interval ) {
    var sortedList = [Graphy.interval.second, Graphy.interval.minute, Graphy.interval.hour, Graphy.interval.day, Graphy.interval.month, Graphy.interval.year]
   
    for ( var i = 0; i < sortedList.length; i++ ) {
      if ( interval < sortedList[i] ) { return sortedList[i]; }
    }

    return Graphy.interval.year;
  }
}
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
Graphy.util = {
 
  applyValueToNewRatio: function( val, oldMin, oldMax, newMin, newMax, flipped ) {
    var ret;
   
    if ( oldMin == oldMax || newMin == newMax ) { 
      ret = 0; 
    } else {
      ret = (newMax - newMin)/(oldMax-oldMin) * (val - oldMin);
    }
   
    return flipped ? (newMax - newMin) - ret + newMin : ret + newMin;
  },
   
  // accepts either a rectangle {top, bottom, left, right} or array of points that should fit inside the rectangle
  createRect: function(rect) {
    var newRect = {
      height: function() { return Math.abs(this.bottom - this.top) },
      width: function() { return Math.abs(this.right - this.left) },
      niceRect: false,
      recalculateWithPoint: function(pt) { // param is 2 dimensional array [x,y]
        if ( pt[0] < newRect.left || newRect.left == undefined ) { newRect.left = pt[0]; }
        if ( pt[0] > newRect.right || newRect.right == undefined ) { newRect.right = pt[0]; }
        if ( pt[1] < newRect.bottom || newRect.bottom == undefined ) { newRect.bottom = pt[1]; }
        if ( pt[1] > newRect.top || newRect.top == undefined ) { newRect.top = pt[1]; }
        newRect.recalculateNicePoint();
      },
      recalculateNicePoint: function() {
        newRect.niceRect = $.extend({}, newRect);
        newRect.niceRect.bottom = Graphy.util.niceNum(newRect.bottom, true);
        newRect.niceRect.top = Graphy.util.niceNum(newRect.top);

        if (newRect.niceRect.top == newRect.niceRect.bottom) {
          newRect.niceRect.top = newRect.niceRect.bottom + 1;
        }
      },
      toString: function() {
        return "{top:" + this.top + ", bottom:" + this.bottom + ", left:" + this.left + ", right:" + this.right + "}";
      }
    };

    if (_.isArray(rect)) {
      _.each(rect, function(pt) { newRect.recalculateWithPoint(pt) });
    } else {
      _.extend(newRect, {
        top: rect && rect.top ? rect.top : 0,
        right: rect && rect.right ? rect.right : 0,
        bottom: rect && rect.bottom ? rect.bottom : 0,
        left: rect && rect.left ? rect.left : 0
      });
    }
   
    newRect.recalculateNicePoint();
   
    return newRect;
  },
 
  functionByNameOrFunction: function( nameOrFunction, pkg, defaultFunction ) {
    var func;
   
    if ( nameOrFunction && nameOrFunction.constructor == Function ) {
      func = nameOrFunction;
    } else if ( nameOrFunction && nameOrFunction.constructor == String ) {
      func = pkg[nameOrFunction];
    } else {
      func = defaultFunction || null;
    }
   
    return func;
  },
 
  niceNum: function( n, goDown ) {
    var signed = n < 0;
    n = Math.abs(n);
   
    var exponent = Math.floor( Math.log(n)/Math.LN10 );
    var frac = n/Math.pow(10,exponent);
  
    var niceFrac = 10;
    var niceFracs = [ 0, 0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9, 1.0 ];
    var wholeNum = Math.floor(frac);
   
    for ( var i = 0; i < niceFracs.length; i++ ) {
      if ( ( goDown || signed ) && !( goDown && signed )  ) { // XOR
        if ( frac >= wholeNum + niceFracs[i] ) { niceFrac = wholeNum + niceFracs[i]; break; }
      } else {
        if ( frac <= wholeNum + niceFracs[i] ) { niceFrac = wholeNum + niceFracs[i]; break; }
      }
    }
   
    return niceFrac * Math.pow(10,exponent) * ( signed ? -1 : 1);
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
/*
*  ATTENTION: 
*  This file is derived from Rico's src/ricoStyles.js (http://openrico.org/) and 
*  is modified to sit inside Graphy without conflict and support css color names by Joel 
*  Birchler @ DECK Monitoring LLC. See the changeset below.
*
*  Color.toColorPart is from prototype.js, included in the Rico library, which is the 
*  Prototype JavaScript framework by Sam Stephenson.
*
*  --
* 
*  Copyright 2005 Sabre Airline Solutions
*
*  Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
*  file except in compliance with the License. You may obtain a copy of the License at
*
*         http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software distributed under the
*  License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
*  either express or implied. See the License for the specific language governing permissions
*  and limitations under the License.
*
*  --
*
*  Prototype JavaScript framework, version 1.6.0.3
*  (c) 2005-2008 Sam Stephenson
*
*  Prototype is freely distributable under the terms of an MIT-style license.
*  For details, see the Prototype web site: http://www.prototypejs.org/
*  
*  --
*
*  CHANGE SET:
* 
*  - Wrapped in modular (non-classical OOP) object for use within Graphy without collision.
*  - RGBColor is a private function derived from Rico.Color.
*  - Merged in Color.toColorPart from prototype.js.
*  - Removed Rico.Color.createColorFromBackground, Rico.Color.createGradientV, Rico.Color.
*    createGradientH, Rico.Color.createGradientContainer, Rico.Color.createColorPath, 
*    Rico.Color.setColorHue and anything outside of Rico.Color.
*
*/
Graphy.Color = (function() {
  
  var Color = {};

  /**
   * @class Methods to manipulate color values.
   * @constructs
   * @param red integer (0-255)
   * @param green integer (0-255)
   * @param blue integer (0-255)
   */
  var RGBColor = function(red, green, blue) {
  
     this.rgb = { r: red, g : green, b : blue };

     this.setRed = function(r) {
        this.rgb.r = r;
        return this;
     };

     this.setGreen = function(g) {
        this.rgb.g = g;
        return this;
     };

     this.setBlue = function(b) {
        this.rgb.b = b;
        return this;
     };

     this.setHue = function(h) {
        // get an HSB model, and set the new hue...
        var hsb = this.asHSB();
        hsb.h = h;

        // convert back to RGB...
        this.rgb = Color.HSBtoRGB(hsb.h, hsb.s, hsb.b);
        return this;
     };

     this.setSaturation = function(s) {
        // get an HSB model, and set the new hue...
        var hsb = this.asHSB();
        hsb.s = s;

        // convert back to RGB and set values...
        this.rgb = Color.HSBtoRGB(hsb.h, hsb.s, hsb.b);
        return this;
     };

     this.setBrightness = function(b) {
        // get an HSB model, and set the new hue...
        var hsb = this.asHSB();
        hsb.b = b;

        // convert back to RGB and set values...
        this.rgb = Color.HSBtoRGB( hsb.h, hsb.s, hsb.b );
        return this;
     };

     this.darken = function(percent) {
        var hsb  = this.asHSB();
        this.rgb = Color.HSBtoRGB(hsb.h, hsb.s, Math.max(hsb.b - percent,0));
        return this;
     };

     this.brighten = function(percent) {
        var hsb  = this.asHSB();
        this.rgb = Color.HSBtoRGB(hsb.h, hsb.s, Math.min(hsb.b + percent,1));
        return this;
     };
   
     this.blend = function(other) {
       if (other.substr) { other = Color.create(other); }
     
       this.rgb.r = Math.floor((this.rgb.r + other.rgb.r)/2);
       this.rgb.g = Math.floor((this.rgb.g + other.rgb.g)/2);
       this.rgb.b = Math.floor((this.rgb.b + other.rgb.b)/2);
     
       return this;
     };

     this.isBright = function() {
        var hsb = this.asHSB();
        return this.asHSB().b > 0.5;
     };

     this.isDark = function() {
        return ! this.isBright();
     };

     this.asRGB = function() {
        return "rgb(" + this.rgb.r + "," + this.rgb.g + "," + this.rgb.b + ")";
     };

     this.asHex = function() {
        return "#" + Color.toColorPart(this.rgb.r) + Color.toColorPart(this.rgb.g) + Color.toColorPart(this.rgb.b);
     };

     this.asHSB = function() {
        return Color.RGBtoHSB(this.rgb.r, this.rgb.g, this.rgb.b);
     };

     this.toString = function() {
        return this.asHex();
     };
  };

  // stolen from prototype. returns padded (2 digit) hex value.
  Color.toColorPart = function(n) {
    var string = n.toString(16);
    if ( string.length == 1 ) { string = "0" + string; }
    return string;
  }

  Color.create = function(s) {
    var hex = ( s.substr(0,1) == "#"  ) ? s : Color.nameToHex(s);
    return Color.createFromHex(hex);
  }

  /**
   * Factory method for creating a color from an RGB string
   * @param hexCode a 3 or 6 digit hex string, optionally preceded by a # symbol
   * @returns a RGBColor object
   */
  Color.createFromHex = function(hexCode) {
    if(hexCode.length==4) {
      var shortHexCode = hexCode;
      hexCode = '#';
      for(var i=1;i<4;i++)
        hexCode += (shortHexCode.charAt(i) + shortHexCode.charAt(i));
    }
    if ( hexCode.indexOf('#') == 0 )
      hexCode = hexCode.substring(1);
    if (!hexCode.match(/^[0-9A-Fa-f]{6}$/)) return null;
    var red   = hexCode.substring(0,2);
    var green = hexCode.substring(2,4);
    var blue  = hexCode.substring(4,6);
    return new RGBColor( parseInt(red,16), parseInt(green,16), parseInt(blue,16) );
  };

  /**
   * Converts hue/saturation/brightness to RGB
   * @returns a 3-element object: r=red, g=green, b=blue.
   */
  Color.HSBtoRGB = function(hue, saturation, brightness) {

    var red   = 0;
    var green = 0;
    var blue  = 0;

    if (saturation == 0) {
       red = parseInt(brightness * 255.0 + 0.5,10);
       green = red;
       blue = red;
    }
    else {
        var h = (hue - Math.floor(hue)) * 6.0;
        var f = h - Math.floor(h);
        var p = brightness * (1.0 - saturation);
        var q = brightness * (1.0 - saturation * f);
        var t = brightness * (1.0 - (saturation * (1.0 - f)));

        switch (parseInt(h,10)) {
           case 0:
              red   = (brightness * 255.0 + 0.5);
              green = (t * 255.0 + 0.5);
              blue  = (p * 255.0 + 0.5);
              break;
           case 1:
              red   = (q * 255.0 + 0.5);
              green = (brightness * 255.0 + 0.5);
              blue  = (p * 255.0 + 0.5);
              break;
           case 2:
              red   = (p * 255.0 + 0.5);
              green = (brightness * 255.0 + 0.5);
              blue  = (t * 255.0 + 0.5);
              break;
           case 3:
              red   = (p * 255.0 + 0.5);
              green = (q * 255.0 + 0.5);
              blue  = (brightness * 255.0 + 0.5);
              break;
           case 4:
              red   = (t * 255.0 + 0.5);
              green = (p * 255.0 + 0.5);
              blue  = (brightness * 255.0 + 0.5);
              break;
            case 5:
              red   = (brightness * 255.0 + 0.5);
              green = (p * 255.0 + 0.5);
              blue  = (q * 255.0 + 0.5);
              break;
        }
    }

     return { r : parseInt(red,10), g : parseInt(green,10) , b : parseInt(blue,10) };
  };

  /**
   * Converts RGB value to hue/saturation/brightness
   * @param r integer (0-255)
   * @param g integer (0-255)
   * @param b integer (0-255)
   * @returns a 3-element object: h=hue, s=saturation, b=brightness.
   * (unlike some HSB documentation which states hue should be a value 0-360, this routine returns hue values from 0 to 1.0)
   */
  Color.RGBtoHSB = function(r, g, b) {

     var hue;
     var saturation;
     var brightness;

     var cmax = (r > g) ? r : g;
     if (b > cmax)
        cmax = b;

     var cmin = (r < g) ? r : g;
     if (b < cmin)
        cmin = b;

     brightness = cmax / 255.0;
     if (cmax != 0)
        saturation = (cmax - cmin)/cmax;
     else
        saturation = 0;

     if (saturation == 0)
        hue = 0;
     else {
        var redc   = (cmax - r)/(cmax - cmin);
        var greenc = (cmax - g)/(cmax - cmin);
        var bluec  = (cmax - b)/(cmax - cmin);

        if (r == cmax)
           hue = bluec - greenc;
        else if (g == cmax)
           hue = 2.0 + redc - bluec;
        else
           hue = 4.0 + greenc - redc;

        hue = hue / 6.0;
        if (hue < 0)
           hue = hue + 1.0;
     }

     return { h : hue, s : saturation, b : brightness };
  };

  Color.setColorHue = function(originColor,opacityPercent,maskRGB) {
    return new RGBColor(
      Math.round(originColor.rgb.r*opacityPercent + maskRGB.rgb.r*(1.0-opacityPercent)),
      Math.round(originColor.rgb.g*opacityPercent + maskRGB.rgb.g*(1.0-opacityPercent)),
      Math.round(originColor.rgb.b*opacityPercent + maskRGB.rgb.b*(1.0-opacityPercent))
    );
  };

  Color.nameToHex = function(s) {
      if (s.substr(0,2) == "0x"){
        return s.substr(2, s.length);
      }
      else{
        return "#" + Color.colorNames[s];
      }
  }

  Color.colorNames = {
      aliceblue: 'f0f8ff',
      antiquewhite: 'faebd7',
      aqua: '00ffff',
      aquamarine: '7fffd4',
      azure: 'f0ffff',
      beige: 'f5f5dc',
      bisque: 'ffe4c4',
      black: '000000',
      blanchedalmond: 'ffebcd',
      blue: '0000ff',
      blueviolet: '8a2be2',
      brown: 'a52a2a',
      burlywood: 'deb887',
      cadetblue: '5f9ea0',
      chartreuse: '7fff00',
      chocolate: 'd2691e',
      coral: 'ff7f50',
      cornflowerblue: '6495ed',
      cornsilk: 'fff8dc',
      crimson: 'dc143c',
      cyan: '00ffff',
      darkblue: '00008b',
      darkcyan: '008b8b',
      darkgoldenrod: 'b8860b',
      darkgray: 'a9a9a9',
      darkgreen: '006400',
      darkkhaki: 'bdb76b',
      darkmagenta: '8b008b',
      darkolivegreen: '556b2f',
      darkorange: 'ff8c00',
      darkorchid: '9932cc',
      darkred: '8b0000',
      darksalmon: 'e9967a',
      darkseagreen: '8fbc8f',
      darkslateblue: '483d8b',
      darkslategray: '2f4f4f',
      darkturquoise: '00ced1',
      darkviolet: '9400d3',
      deeppink: 'ff1493',
      deepskyblue: '00bfff',
      dimgray: '696969',
      dodgerblue: '1e90ff',
      feldspar: 'd19275',
      firebrick: 'b22222',
      floralwhite: 'fffaf0',
      forestgreen: '228b22',
      fuchsia: 'ff00ff',
      gainsboro: 'dcdcdc',
      ghostwhite: 'f8f8ff',
      gold: 'ffd700',
      goldenrod: 'daa520',
      gray: '808080',
      green: '008000',
      greenyellow: 'adff2f',
      honeydew: 'f0fff0',
      hotpink: 'ff69b4',
      indianred : 'cd5c5c',
      indigo : '4b0082',
      ivory: 'fffff0',
      khaki: 'f0e68c',
      lavender: 'e6e6fa',
      lavenderblush: 'fff0f5',
      lawngreen: '7cfc00',
      lemonchiffon: 'fffacd',
      lightblue: 'add8e6',
      lightcoral: 'f08080',
      lightcyan: 'e0ffff',
      lightgoldenrodyellow: 'fafad2',
      lightgrey: 'd3d3d3',
      lightgreen: '90ee90',
      lightpink: 'ffb6c1',
      lightsalmon: 'ffa07a',
      lightseagreen: '20b2aa',
      lightskyblue: '87cefa',
      lightslateblue: '8470ff',
      lightslategray: '778899',
      lightsteelblue: 'b0c4de',
      lightyellow: 'ffffe0',
      lime: '00ff00',
      limegreen: '32cd32',
      linen: 'faf0e6',
      magenta: 'ff00ff',
      maroon: '800000',
      mediumaquamarine: '66cdaa',
      mediumblue: '0000cd',
      mediumorchid: 'ba55d3',
      mediumpurple: '9370d8',
      mediumseagreen: '3cb371',
      mediumslateblue: '7b68ee',
      mediumspringgreen: '00fa9a',
      mediumturquoise: '48d1cc',
      mediumvioletred: 'c71585',
      midnightblue: '191970',
      mintcream: 'f5fffa',
      mistyrose: 'ffe4e1',
      moccasin: 'ffe4b5',
      navajowhite: 'ffdead',
      navy: '000080',
      oldlace: 'fdf5e6',
      olive: '808000',
      olivedrab: '6b8e23',
      orange: 'ffa500',
      orangered: 'ff4500',
      orchid: 'da70d6',
      palegoldenrod: 'eee8aa',
      palegreen: '98fb98',
      paleturquoise: 'afeeee',
      palevioletred: 'd87093',
      papayawhip: 'ffefd5',
      peachpuff: 'ffdab9',
      peru: 'cd853f',
      pink: 'ffc0cb',
      plum: 'dda0dd',
      powderblue: 'b0e0e6',
      purple: '800080',
      red: 'ff0000',
      rosybrown: 'bc8f8f',
      royalblue: '4169e1',
      saddlebrown: '8b4513',
      salmon: 'fa8072',
      sandybrown: 'f4a460',
      seagreen: '2e8b57',
      seashell: 'fff5ee',
      sienna: 'a0522d',
      silver: 'c0c0c0',
      skyblue: '87ceeb',
      slateblue: '6a5acd',
      slategray: '708090',
      snow: 'fffafa',
      springgreen: '00ff7f',
      steelblue: '4682b4',
      tan: 'd2b48c',
      teal: '008080',
      thistle: 'd8bfd8',
      tomato: 'ff6347',
      turquoise: '40e0d0',
      violet: 'ee82ee',
      violetred: 'd02090',
      wheat: 'f5deb3',
      white: 'ffffff',
      whitesmoke: 'f5f5f5',
      yellow: 'ffff00',
      yellowgreen: '9acd32'
  };
  
  return Color;
  
})();// Copyright 2010-2012 DECK Monitoring LLC.
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
Graphy.renderers = {
 
  vRule: function(value, precision, graph) {
    var ctx = graph.ctx(), valueRect = graph.valueRect(), graphRect = graph.graphRect();
    ctx.save();
   
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#ccc";
   
    x = Math.round(Graphy.util.applyValueToNewRatio(value, valueRect.left, valueRect.right, graphRect.left, graphRect.right)) - 0.5;
   
    for ( var y = 0; y < graphRect.bottom - 2; y+=4 ) {
      ctx.moveTo( x, y );
      ctx.lineTo( x, y + 2 );
    }
   
    ctx.stroke();      
    ctx.restore();
   
    if ( graph.vRuleLabel() ) {
      // FIXME: label should not be in the axis module at this point
      Graphy.renderers.axis.label( Graphy.formatters.humanDate(value, precision),
        x + 15, 
        57, 
        graph,
        "graphy_vRuleLabel", 
        null,
        "left" );
    }
  },
 
  plot: function(index, data, options, graph) {
    var ctx = graph.ctx(), 
        valueRect = options['unit'] ? graph.valueRectByUnit(options['unit']).niceRect : graph.valueRect().niceRect,
        graphRect = graph.graphRect(),
        x,
        y;
   
    ctx.save();
   
    var fill = options.color || "gray";
    ctx.lineWidth = options.width || 1;
   
    for ( var j = 0; j < data.length; j++ ) {
      x = Math.round( Graphy.util.applyValueToNewRatio(data[j][0], valueRect.left, valueRect.right, graphRect.left, graphRect.right) );
      y = Math.round( Graphy.util.applyValueToNewRatio(data[j][1], valueRect.bottom, valueRect.top, graphRect.top, graphRect.bottom, true) );
     
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
        valueRect = options['unit'] ? graph.valueRectByUnit(options['unit']).niceRect : graph.valueRect().niceRect, 
        graphRect = graph.graphRect(),
        x,
        y,
        rgb = Graphy.Color.create(options.color || "gray").rgb,
        alpha = !graph.hasSelectedItems() || options['selected'] ? 1 : 0.2;
   
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = 'rgba('+rgb.r+', '+rgb.g+', '+rgb.b+', '+alpha+')';
    ctx.lineWidth = options.width || 1;
   
    for ( var j = 0; j < data.length; j++ ) {
      x = Graphy.util.applyValueToNewRatio(data[j][0], valueRect.left, valueRect.right, graphRect.left, graphRect.right) + 0.5;
      y = Graphy.util.applyValueToNewRatio(data[j][1], valueRect.bottom, valueRect.top, graphRect.top, graphRect.bottom, true) + 0.5;
      j ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
    }
    ctx.stroke();
   
    ctx.restore();
  },
 
  bar: function(index, data, options, graph) {
    var ctx = graph.ctx(),
        valueRect = options['unit'] ? graph.valueRectByUnit(options['unit']).niceRect : graph.valueRect().niceRect, 
        graphRect = graph.graphRect(),
        x,
        y,
        zero_y = Graphy.util.applyValueToNewRatio(0, valueRect.bottom, valueRect.top, graphRect.top, graphRect.bottom, true),
        h,
        maxW = _.min([60, Math.floor((graph.graphRect().right - graph.graphRect().left) / (graph.maxNumBarsInPlot()))]),//how wide a bar slot can be
        w = _.max([1, Math.floor(maxW / graph.barPlots().length)-1]),//width of the bar
        top_color = options['color'] || "gray",
        bottom_color = top_color,
        gradient,
        alpha = !graph.hasSelectedItems() || options['selected'] ? 1 : 0.2;

    var precision = Graphy.util.calculatePrecision(valueRect.bottom, valueRect.top)

    bottomRGB = Graphy.Color.create(top_color).darken(.1).rgb;
    topRGB = Graphy.Color.create(top_color).brighten(.05).rgb;

    ctx.save();
    ctx.beginPath();
   
    for ( var j = 0; j < data.length; j++ ) {
      x = Math.round( Graphy.util.applyValueToNewRatio(data[j][0], valueRect.left, valueRect.right, graphRect.left, graphRect.right)) - Math.ceil(maxW/2) + ((w+1) * (index-1));//indexed is 1 based
      y = Math.round( Graphy.util.applyValueToNewRatio(data[j][1], valueRect.bottom, valueRect.top, graphRect.top, graphRect.bottom, true) );
      h = zero_y - y;
         
      gradient = ctx.createLinearGradient(x, y, x, y + h);
      gradient.addColorStop(0, 'rgba('+topRGB.r+', '+topRGB.g+', '+topRGB.b+', '+alpha+')');
      gradient.addColorStop(0.5, 'rgba('+bottomRGB.r+', '+bottomRGB.g+', '+bottomRGB.b+', '+alpha+')');
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
      return graph.graphRect();
    },
   
    //
    // just the facts (text)
    //
    cleanX: function(action, graph) {
      var $canvas = graph.$canvas(), 
          ctx = graph.ctx(), 
          valueRect = graph.valueRect().niceRect, 
          graphRect = graph.graphRect(), 
          xAxisInterval = graph.xAxisInterval(),
          xAxisLabelFormatter = graph.xAxisLabelFormatter();
     
      if ( action == "measure" ) {
        graphRect.bottom = $canvas.height() - 24 - ( graph.xUnits().length ? 20 : 0 );
        graphRect.right = $canvas.width() - 14;
      } else {
        var numberOfLabels = Math.max( Math.floor( ( graphRect.right - graphRect.left ) / 140 ) + 1, 2 );
        Graphy.renderers.axis.xValueLabels( numberOfLabels, 0, graphRect.bottom + 10, "graphy_axis_line_x_value_label", "center", graph );
        Graphy.renderers.axis.unitLabels( "x", graph );
      }

      return graphRect;
    },
   
    //
    // text with a horizontal bottom line
    //
    lineX: function(action, graph) {
      var $canvas = graph.$canvas(), 
          ctx = graph.ctx(), 
          valueRect = graph.valueRect().niceRect, 
          graphRect = graph.graphRect(), 
          xAxisInterval = graph.xAxisInterval(),
          xAxisLabelFormatter = graph.xAxisLabelFormatter();
     
      if ( action == "measure" ) {
        graphRect.bottom = $canvas.height() - 24 - ( graph.xUnits().length ? 20 : 0 );
        graphRect.right = $canvas.width() - 14;
      } else {
        ctx.save();
     
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.strokeStyle = "#ddd";
        ctx.moveTo(graphRect.left - 16.5, graphRect.bottom - 0.5);
        ctx.lineTo($canvas.width(), graphRect.bottom - 0.5);
        ctx.stroke();
     
        ctx.restore();
     
        var numberOfLabels = Math.max( Math.floor( ( graphRect.right - graphRect.left ) / 72 ) + 1, 2 );
        Graphy.renderers.axis.xValueLabels( numberOfLabels, 0, graphRect.bottom + 10, "graphy_axis_line_x_value_label", "center", graph );
        Graphy.renderers.axis.unitLabels( "x", graph );
      }
     
      return graphRect;
    },
   
    //
    // simple horizontal line with ticks for each plot.
    //
    scatterX: function(action, graph) {
      var $canvas = graph.$canvas(), 
          ctx = graph.ctx(), 
          valueRect = graph.valueRect().niceRect, 
          graphRect = graph.graphRect(), 
          xAxisInterval = graph.xAxisInterval(),
          xAxisLabelFormatter = graph.xAxisLabelFormatter();
     
      if ( action == "measure" ) {
        graphRect.bottom = $canvas.height() - 24 - ( graph.xUnits().length ? 20 : 0 );
        graphRect.right = $canvas.width() - 14;
      } else {
        // kick off drawing
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#ddd";        
       
        // long axis line
        ctx.beginPath();
        ctx.moveTo(graphRect.left - 1, graphRect.bottom + 16.5);
        ctx.lineTo(graphRect.right + 1, graphRect.bottom + 16.5);
        ctx.stroke();
       
        // labels
        var numberOfLabels = Math.max( Math.floor( ( graphRect.right - graphRect.left ) / 72 ) + 1, 2 );
        Graphy.renderers.axis.xValueLabels( numberOfLabels, 0, graphRect.bottom + 18, "graphy_axis_line_x_value_label", "center", graph );
        Graphy.renderers.axis.unitLabels( "x", graph );
       
        // finish drawing
        ctx.restore();
       
        Graphy.renderers.axis.scatterTicks(graph);
      }
     
      return graphRect;
    },
   
    //
    // simple horizontal lines with a dark bottom line
    //
    cleanY: function(action, graph) {
      var $canvas = graph.$canvas(), 
          ctx = graph.ctx(), 
          valueRect = graph.valueRect().niceRect, 
          graphRect = graph.graphRect(),
          axis_pad = graph.yUnits().length ? 24 : 0;     
     
      if ( action == "measure" ) {
        graphRect.left = axis_pad;
        graphRect.top = 16;
      } else {
        ctx.save();
        ctx.lineWidth = 1;
 
        var numberOfLines = Math.max( Math.floor( ( graphRect.bottom - graphRect.top ) / 70 ) + 1, 3 );
        var h, roundH;
 
        for ( var i = 0; i < numberOfLines; i++ ) {
          h = graphRect.bottom - ( i * ( ( graphRect.bottom - graphRect.top ) / ( numberOfLines - 1 )  ) );
          roundH = Math.round(h);
          ctx.beginPath();
          ctx.strokeStyle = i ? "#f0f0f0" : "#ddd";
          ctx.moveTo(axis_pad + 3, roundH - 0.5);
          ctx.lineTo($canvas.width(), roundH - 0.5);
          ctx.stroke();
        }
 
        // labels
        Graphy.renderers.axis.yValueLabels( numberOfLines, 4, -14, "graphy_axis_clean_y_value_label", "left",  graph );
        Graphy.renderers.axis.unitLabels( "y", graph );
        ctx.restore();
       
        // pad in the edges a little more
        graphRect.left += 30;
        graphRect.right -= 30;
      }
     
      return graphRect;
    },
   
    //
    // simple vertical line
    //
    lineY: function(action, graph) {
      var $canvas = graph.$canvas(), 
          ctx = graph.ctx(), 
          valueRect = graph.valueRect().niceRect, 
          graphRect = graph.graphRect(),
          axis_pad = graph.yUnits().length ? 24 : 0;
     
      if ( action == "measure" ) {
        graphRect.left = axis_pad;
        graphRect.top = 16;
      } else {
        // labels
        var numberOfLines = Math.max( Math.floor( ( graphRect.bottom - graphRect.top ) / 72 ) + 1, 3 );
        Graphy.renderers.axis.yValueLabels( numberOfLines, 0, -8, "graphy_axis_line_y_value_label", "right", graph );
        Graphy.renderers.axis.unitLabels( "y", graph );
       
        // the line
        ctx.save();

        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.strokeStyle = "#ddd";
        ctx.moveTo(graphRect.left - 16.5, graphRect.top - 1);
        ctx.lineTo(graphRect.left - 16.5, graphRect.bottom + 1);
        ctx.stroke();
       
        ctx.restore();
      }
     
      return graphRect;
    },
   
    //
    // simple vertical line with ticks for each plot.
    //
    scatterY: function(action, graph) {
      var graphRect = Graphy.renderers.axis.lineY(action, graph);
     
      if ( action == "draw" ) {
        var $canvas = graph.$canvas(), 
            ctx = graph.ctx(),
            valueRect = graph.valueRect().niceRect;
       
        // adjust for the ticks
        graphRect.left += 8;
       
        if (graph.xAxisRenderer() != Graphy.renderers.axis.scatterX) { Graphy.renderers.axis.scatterTicks(graph); }
      }
     
      return graphRect;
    },
   
    scatterTicks: function(graph) {
      var $canvas = graph.$canvas(), 
          ctx = graph.ctx(),
          valueRect = graph.valueRect().niceRect, 
          graphRect = graph.graphRect();
     
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
          if (graph.yAxisRenderer() == Graphy.renderers.axis.scatterY) {
            y = Math.floor(Graphy.util.applyValueToNewRatio( data[j][1], valueRect.bottom, valueRect.top, graphRect.bottom, graphRect.top )) - 0.5;
            ctx.moveTo(graphRect.left - 22, y);
            ctx.lineTo(graphRect.left - 18, y);
          }
         
          if (graph.xAxisRenderer() == Graphy.renderers.axis.scatterX) {
            x = Math.floor(Graphy.util.applyValueToNewRatio( data[j][0], valueRect.left, valueRect.right, graphRect.left, graphRect.right )) - 0.5;
            ctx.moveTo(x, graphRect.bottom + 14);
            ctx.lineTo(x, graphRect.bottom + 10);
          }
        }
      }
     
      // finish drawing
      ctx.stroke();
      ctx.restore();
    },
   
    label: function(val, x, y, graph, styleName, formatter, align, color, opacity) {	
      var $canvas = graph.$canvas();
      var left = Math.round($canvas.offset().left + x);
      var top = Math.round($canvas.offset().top + y);
     
      // stoopid IE6
      if ( $.browser.msie && $.browser.version.charAt(0) == "6" ) {
        top -= $(window).scrollTop();
      }

      if ( formatter ) { val = formatter(val); }
     
      $el = $("<p class='"+styleName+" graphy_axis_label graphy_axis_label_"+graph.index()+"' style='"+ ( color ? 'color:' + color + '; ' : '' ) + ( opacity ? 'opacity:' + opacity + '; ' : '' ) + "'>" + val + "</p>");
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
    unitLabels: function(axis, graph) {
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
          Graphy.renderers.axis.label( axis_label, graph.graphRect().left + (graph.graphRect().width() / 2), graph.graphRect().top + graph.graphRect().height() + 40, graph, "graphy_axis_unit_label graphy_axis_xUnit_label", null, "center" );
        } else {
          Graphy.renderers.axis.label( axis_label, 0, graph.graphRect().top + (graph.graphRect().height() / 2), graph, "graphy_axis_unit_label graphy_axis_yUnit_label vertical_text", null, "vertical_center" );
        }
      }
    },
   
    xValueLabels: function(numberOfLabels, xOffset, yOffset, styleName, align, graph) {	
      var $canvas = graph.$canvas(),
          valueRect = graph.valueRect().niceRect,
          graphRect = graph.graphRect(),
          xAxisInterval = graph.xAxisInterval(),
          xAxisLabelFormatter = graph.xAxisLabelFormatter(),
          align = align || "center",
          roundV, labels_to_draw = {};

      if (!valueRect.width() > 0) {
        return;
      }

      if ( !xAxisInterval || xAxisInterval < Graphy.interval.hour ) { xAxisInterval = Graphy.interval.hour; }

      var biggerInterval = Graphy.interval.biggerInterval(xAxisInterval);
      var left = xAxisLabelFormatter == Graphy.formatters.humanDate ?  Graphy.interval.floor(valueRect.left, biggerInterval).getTime() : valueRect.left;
      var labelCount = 0;

      if ( xAxisInterval > Graphy.interval.hour && xAxisLabelFormatter == Graphy.formatters.humanDate ) {
        // step by nice dates
        var stepIncrement = Math.ceil(((valueRect.right - valueRect.left)/xAxisInterval)/numberOfLabels);
       
        for ( ms = left; 
              ms <= valueRect.right; 
              ms = Graphy.interval.stepDate(ms, xAxisInterval, stepIncrement) ) {

          roundV = Math.round( Graphy.util.applyValueToNewRatio( ms, 
            valueRect.left,
            valueRect.right, 
            graphRect.left, 
            graphRect.right ) );

          if (roundV > 16 && !labels_to_draw[ms]) { 
            labels_to_draw[ms] = {x: roundV, text: Graphy.formatters.humanDate(ms, xAxisInterval)}; 
          }
         
          labelCount++; 
        }
       
      } else {
        // raw-style 
        // first pass with the bigger interval
        if ( xAxisLabelFormatter == Graphy.formatters.humanDate ) {
          for ( var ms = left; 
                ms <= valueRect.right; 
                ms = Graphy.interval.stepDate(ms, biggerInterval) ) {

            roundV = Math.round( Graphy.util.applyValueToNewRatio( ms, 
              valueRect.left,
              valueRect.right, 
              graphRect.left, 
              graphRect.right ) );

            if (roundV > 16) { 
              labels_to_draw[ms] = {x: roundV, text: Graphy.formatters.humanDate(ms, biggerInterval)}; 
              Graphy.renderers.vRule( ms, biggerInterval, graph );
            }
            labelCount++; // include unplotted labels
          }
        }
       
        var precision = Graphy.util.calculatePrecision(valueRect.left, valueRect.right);

        // fill in (1/2, 1/4, 1/8...) until out of labels       
        for ( var jump = biggerInterval;
              // protect against jump getting so small that left + jump == left
              labelCount*2-1 < numberOfLabels && left + jump > left;
              jump /= 2) {
          for ( n = left + jump; 
                n <= valueRect.right; 
                n += jump ) {
                 
            roundV = Math.round( Graphy.util.applyValueToNewRatio( n, 
              valueRect.left,
              valueRect.right, 
              graphRect.left, 
              graphRect.right ) );

            if (roundV && !labels_to_draw[n]) { 
              labels_to_draw[n] = {x: roundV, text: xAxisLabelFormatter ? xAxisLabelFormatter(n, xAxisInterval) : n.toPrecision(precision) }; 
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
            label.x + xOffset,
            yOffset, 
            graph, 
            styleName, 
            null, 
            align );
          last_x = label.x;
        }
      });        
    },
   
    yValueLabels: function(numberOfLabels, xOffset, yOffset, styleName, align, graph) {
      var $canvas = graph.$canvas(),
          graphRect = graph.graphRect(),
          h, 
          roundH, 
          val, 
          precise, 
          precision, 
          $el, 
          arrayOf$Els = [],
          maxLabelWidth, 
          x = graphRect.left,
          yUnits = graph.yUnits();
     
     
      // this guy puts everything together to make an individual label
      var _yLabel = function(valueRect, x, color) {
        precision = Graphy.util.calculatePrecision(valueRect.bottom, valueRect.top)

        val = Math.round( Graphy.util.applyValueToNewRatio( h, graphRect.bottom, graphRect.top, valueRect.bottom, valueRect.top ) * 100 ) / 100;

        precise = val.toPrecision(precision);

        return Graphy.renderers.axis.label( val == precise ? val : precise, xOffset + x, roundH + yOffset, graph, styleName, null, align, color );
      };
     
      // loop through the rows for each unit
      for ( var j = 0; j < (yUnits.length || 1); j++ ) {
        maxLabelWidth = 0;
       
        for ( var i = 0; i < numberOfLabels; i++ ) {
          h = graphRect.bottom - ( i * ( ( graphRect.bottom - graphRect.top ) / ( numberOfLabels - 1 ) ) );
          roundH = Math.round(h);
         
          if ( yUnits.length ) {
            $el = _yLabel( graph.valueRectByUnit(yUnits[j]['label']).niceRect, x, ( yUnits.length > 1 ? yUnits[j]['color'] : null ) );
          } else {
            $el = _yLabel( graph.valueRect().niceRect, x);
          }
         
          arrayOf$Els.push( $el );
          maxLabelWidth = Math.max( $el.width(), maxLabelWidth );
        }
       
        x += Math.ceil(maxLabelWidth) + 15;
      }
     
      if ( align == "right" ) { 
        var numberOf$Els = arrayOf$Els.length;
        for ( var k = 0; k < numberOf$Els; k++ ) {
           arrayOf$Els[k].offset({left: arrayOf$Els[k].offset().left + maxLabelWidth - 5});
        }
      }
      if ( x > graphRect.left ) { graphRect.left = x; }
    }  
  }
}
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
return Graphy;
});