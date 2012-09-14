      .oooooo.                                  oooo                    
     d8P'  `Y8b                                 `888                    
    888           oooo d8b  .oooo.   oo.ooooo.   888 .oo.   oooo    ooo 
    888           `888""8P `P  )88b   888' `88b  888P"Y88b   `88.  .8'  
    888     ooooo  888      .oP"888   888   888  888   888    `88..8'   
    `88.    .88'   888     d8(  888   888   888  888   888     `888'    
     `Y8bood8P'   d888b    `Y888""8o  888bod8P' o888o o888o     .8'     
                                      888                   .o..P'      
                                     o888o                  `Y8P'


A JavaScript canvas graphing library for drawing lines, bars, and scatter plots.

What You Need
=============

Graphy requires [underscore](http://underscorejs.org/) and [jQuery](http://jquery.com/). It also requires _libs/jquery.createcanvas.js_. You may choose to use _graphy.js_ (which adds the variable `Graphy` to the global namespace) or _require-graphy.js_ (which uses the excellent [RequireJS](http://requirejs.org/) library).

Also be sure to include _graphy.css_. Your html may look something like this:

    <script src="../lib/jquery-1.7.2.min.js" type="text/javascript"></script>
    <script src="../lib/underscore-1.3.3.min.js" type="text/javascript"></script>
    <script src="../lib/jquery.createcanvas.js" type="text/javascript"></script>
    <script src="../graphy.js" type="text/javascript"></script>

    <link rel="stylesheet" type="text/css" href="../graphy.css" />
  
Usage
=====

We start by creating a blank graph.

    var g = Graphy.createGraph({
      canvas: '#graph', 
      xAxisInterval: Graphy.interval.hour, 
      xAxisLabelFormatter: Graphy.formatters.humanDate
    });
  
`createGraph` accepts a hash with the following parameters:

* canvas (_required_): Selector for a canvas element or any other html element (which will be transformed into a canvas). If this contains text, Graphy will assign this text to plot_json.

* plot: Calls self.plot with value as parameter.
* plots: Calls self.plots with value as parameter.
* plot_json: Calls self.plot_json with value as parameter.
* options: Sets the default style information for plots. Plots may override this. These are renderer specific. Example: `{"width": 2, "color": "red", "unit": "oxen/m³"}`
* xAxisInterval: Specify a fixed interval. See Graphy.interval.
* xAxisLabelFormatter: Function or string name of function to format label text. See Graphy.formatters.
* xAxisRenderer: Function or string name of function to render x axis. See Graphy.renderers.axis. (default: "cleanX")
* yAxisRenderer: Function or string name of function to render y axis. See Graphy.renderers.axis. (default: "cleanY")

Next we add a plot to the graph.

    g.plot(
      [
        [new Date(2010,10,28,22), 1],
        [new Date(2010,10,28,23), 6],
        [new Date(2010,10,29,0), 42]
      ], 
      { 
        renderer: 'bar',
        color: 'papayawhip',
        unit: 'label'
      } 
    );

And finally, we draw it.

    g.draw();
  
You can clear the plots on the graph by calling `clear`.

    g.clear();

Be sure to check out the `examples` directory and source comments for more.

Development
===========

We are happy for people to contribute to the codebase.

Graphy uses the [Aladdin](https://github.com/rlayte/aladdin) testing framework. This is an easily installable, low barrier to entry runner for [Jasmine](https://github.com/pivotal/jasmine) via [PhantomJS](http://phantomjs.org/). Tests are located in the `spec` directory. Run tests by typing `aladdin`.

The included `build.sh` compiles the source files into _graphy.js_, wraps this in an AMD boilerplate for use with [RequireJS](http://requirejs.org/) output as _require-graphy.js_, and then runs the tests.

Source Files
------------

* _graphy.color_ : Contains color functions used for gradients and hex values.
* _graphy.core_ : Defines the Graphy module. Everything starts here.
* _graphy.filters_: Filters to be applied to a values before graphing.
* _graphy.formatters_: Changes number values for display.
* _graphy.interval_: Millisecond variables for different time intervals (second, minute, etc.)
* _graphy.renderers_: All actual graphics should be handled in here.
* _graphy.util_: Common (hopefully useful) graphing functions.

Copyright and License
=====================

Copyright 2010-2012 DECK Monitoring LLC.

Graphy is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

Graphy is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser Public License for more details.

You should have received a copy of the Lesser General Public License along with Graphy. If not, see <http://www.gnu.org/licenses/>.

![LGPL](http://github.com/deck/graphy/raw/master/lgpl.png) 

Attributions
============

_source/graphy.color.js_ is derived from Rico and includes a method from Prototype. Rico is copyright 2005 Sabre Airline Solutions and distributed under the Apache License v2.0. Prototype is copyright 2005-2008 Sam Stephenson and distributed under an MIT-style license. See the _source/graphy.color.js_ source file for further details.
