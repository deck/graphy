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
