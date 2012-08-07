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
