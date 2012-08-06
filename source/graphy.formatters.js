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
