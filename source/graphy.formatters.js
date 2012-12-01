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
    } else if ( precision < Graphy.interval.month && date.getHours() == 12 && date.getMinutes() === 0 ) {
      val = "noon";
    } else if ( precision < Graphy.interval.month && date.getHours() || date.getMinutes() || date.getSeconds()  ) {
      var suffix = "am";
      var hours = date.getHours();
      if ( hours >= 12 ) {
        suffix = "pm";
        if ( hours > 12 ) {
          hours -= 12;
        }
      } else if ( hours === 0 ) {
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

  shortDate: function(val, precision) {
    var date = new Date(val);
    precision = precision || 1;
    
    if ( isNaN( date.getTime() ) ) {
      val = "";
    } else if ( precision < Graphy.interval.month && date.getHours() == 12 && date.getMinutes() === 0 ) {
      val = "12:00";
    } else if ( precision < Graphy.interval.month && (date.getHours() || date.getMinutes() || date.getSeconds()) ) {
      var hours = date.getHours();
      var minutes = date.getMinutes();
      if ( minutes < 10 ) { minutes = "0" + minutes; }
      val = hours + ":" + minutes;
    } else if ( precision < Graphy.interval.month && date.getDate() ) {
      var day = date.getDate();
      if(day < 10) { day = "0" + day; }
      var month = date.getMonth() + 1;
      if(month < 10) { month = "0" + month; }
      val = month + "/" + day;
    } else {
      var month = date.getMonth() + 1;
      if(month < 10) { month = "0" + month; }
      var year = date.getFullYear();
      year = year.toString().substr(2, 2);
      val = month + "/01/" + year;
    }
    return val;
  },

  fixedTwo: function(val, precision) {
    return val.toFixed(2);
  },

  fixedOne: function(val, precision) {
    return val.toFixed(1);
  },

  integer: function(val, precision) {
    return parseInt(val, 10);
  },
  
  usMoney: function(val, precision) {
    var c = 2,
        d = ".",
        t = ",",
        s = val < 0 ? "-" : "",
        i = parseInt(val = Math.abs(+val || 0).toFixed(c), 10) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + "$" + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(val - i).toFixed(c).slice(2) : "");
  },

  none: function(val, precision){
    return " ";
  },
 
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
}
