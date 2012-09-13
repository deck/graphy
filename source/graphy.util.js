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
