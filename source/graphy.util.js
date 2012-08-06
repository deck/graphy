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