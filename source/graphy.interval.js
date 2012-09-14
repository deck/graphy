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
