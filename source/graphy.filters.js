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
