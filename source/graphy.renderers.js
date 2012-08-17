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

    if ( Rico && Rico.Color ) {
      bottom_rgb = Rico.Color.create(top_color).darken(.1).rgb;
      top_rgb = Rico.Color.create(top_color).brighten(.05).rgb;
    } else {
      console.warn("Bar graphs look better when you include Rico.Color with your js.")
    }

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

      if (!value_rect.width() > 0) {
        return;
      }

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
        for ( var jump = bigger_interval;
              // protect against jump getting so small that left + jump == left
              labelCount*2-1 < number_of_labels && left + jump > left;
              jump /= 2) {
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
