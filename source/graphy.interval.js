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
