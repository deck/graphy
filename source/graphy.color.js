/*
 *  Copyright 2005 Sabre Airline Solutions
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 *  file except in compliance with the License. You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under the
 *  License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 *  either express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 *
 *  --
 *
 *  File modified to sit inside Graphy without conflict and support css color names by Joel @ DECK.
 *
 */

Graphy.Color = (function() {
	
	var Color = {};

	/**
	 * @class Methods to manipulate color values.
	 * @constructs
	 * @param red integer (0-255)
	 * @param green integer (0-255)
	 * @param blue integer (0-255)
	 */
	var RGBColor = function(red, green, blue) {
  
	   this.rgb = { r: red, g : green, b : blue };

	   this.setRed = function(r) {
	      this.rgb.r = r;
	      return this;
	   };

	   this.setGreen = function(g) {
	      this.rgb.g = g;
	      return this;
	   };

	   this.setBlue = function(b) {
	      this.rgb.b = b;
	      return this;
	   };

	   this.setHue = function(h) {
	      // get an HSB model, and set the new hue...
	      var hsb = this.asHSB();
	      hsb.h = h;

	      // convert back to RGB...
	      this.rgb = Color.HSBtoRGB(hsb.h, hsb.s, hsb.b);
	      return this;
	   };

	   this.setSaturation = function(s) {
	      // get an HSB model, and set the new hue...
	      var hsb = this.asHSB();
	      hsb.s = s;

	      // convert back to RGB and set values...
	      this.rgb = Color.HSBtoRGB(hsb.h, hsb.s, hsb.b);
	      return this;
	   };

	   this.setBrightness = function(b) {
	      // get an HSB model, and set the new hue...
	      var hsb = this.asHSB();
	      hsb.b = b;

	      // convert back to RGB and set values...
	      this.rgb = Color.HSBtoRGB( hsb.h, hsb.s, hsb.b );
	      return this;
	   };

	   this.darken = function(percent) {
	      var hsb  = this.asHSB();
	      this.rgb = Color.HSBtoRGB(hsb.h, hsb.s, Math.max(hsb.b - percent,0));
	      return this;
	   };

	   this.brighten = function(percent) {
	      var hsb  = this.asHSB();
	      this.rgb = Color.HSBtoRGB(hsb.h, hsb.s, Math.min(hsb.b + percent,1));
	      return this;
	   };
   
	   this.blend = function(other) {
	     if (other.substr) { other = Color.create(other); }
     
	     this.rgb.r = Math.floor((this.rgb.r + other.rgb.r)/2);
	     this.rgb.g = Math.floor((this.rgb.g + other.rgb.g)/2);
	     this.rgb.b = Math.floor((this.rgb.b + other.rgb.b)/2);
     
	     return this;
	   };

	   this.isBright = function() {
	      var hsb = this.asHSB();
	      return this.asHSB().b > 0.5;
	   };

	   this.isDark = function() {
	      return ! this.isBright();
	   };

	   this.asRGB = function() {
	      return "rgb(" + this.rgb.r + "," + this.rgb.g + "," + this.rgb.b + ")";
	   };

	   this.asHex = function() {
	      return "#" + Color.toColorPart(this.rgb.r) + Color.toColorPart(this.rgb.g) + Color.toColorPart(this.rgb.b);
	   };

	   this.asHSB = function() {
	      return Color.RGBtoHSB(this.rgb.r, this.rgb.g, this.rgb.b);
	   };

	   this.toString = function() {
	      return this.asHex();
	   };
	};

	// stolen from prototype. returns padded (2 digit) hex value.
	Color.toColorPart = function(n) {
	  var string = n.toString(16);
	  if ( string.length == 1 ) { string = "0" + string; }
	  return string;
	}

	Color.create = function(s) {
	  var hex = ( s.substr(0,1) == "#"  ) ? s : Color.nameToHex(s);
	  return Color.createFromHex(hex);
	}

	/**
	 * Factory method for creating a color from an RGB string
	 * @param hexCode a 3 or 6 digit hex string, optionally preceded by a # symbol
	 * @returns a RGBColor object
	 */
	Color.createFromHex = function(hexCode) {
	  if(hexCode.length==4) {
	    var shortHexCode = hexCode;
	    hexCode = '#';
	    for(var i=1;i<4;i++)
	      hexCode += (shortHexCode.charAt(i) + shortHexCode.charAt(i));
	  }
	  if ( hexCode.indexOf('#') == 0 )
	    hexCode = hexCode.substring(1);
	  if (!hexCode.match(/^[0-9A-Fa-f]{6}$/)) return null;
	  var red   = hexCode.substring(0,2);
	  var green = hexCode.substring(2,4);
	  var blue  = hexCode.substring(4,6);
	  return new RGBColor( parseInt(red,16), parseInt(green,16), parseInt(blue,16) );
	};

	/**
	 * Converts hue/saturation/brightness to RGB
	 * @returns a 3-element object: r=red, g=green, b=blue.
	 */
	Color.HSBtoRGB = function(hue, saturation, brightness) {

	  var red   = 0;
		var green = 0;
		var blue  = 0;

	  if (saturation == 0) {
	     red = parseInt(brightness * 255.0 + 0.5,10);
		   green = red;
		   blue = red;
		}
		else {
	      var h = (hue - Math.floor(hue)) * 6.0;
	      var f = h - Math.floor(h);
	      var p = brightness * (1.0 - saturation);
	      var q = brightness * (1.0 - saturation * f);
	      var t = brightness * (1.0 - (saturation * (1.0 - f)));

	      switch (parseInt(h,10)) {
	         case 0:
	            red   = (brightness * 255.0 + 0.5);
	            green = (t * 255.0 + 0.5);
	            blue  = (p * 255.0 + 0.5);
	            break;
	         case 1:
	            red   = (q * 255.0 + 0.5);
	            green = (brightness * 255.0 + 0.5);
	            blue  = (p * 255.0 + 0.5);
	            break;
	         case 2:
	            red   = (p * 255.0 + 0.5);
	            green = (brightness * 255.0 + 0.5);
	            blue  = (t * 255.0 + 0.5);
	            break;
	         case 3:
	            red   = (p * 255.0 + 0.5);
	            green = (q * 255.0 + 0.5);
	            blue  = (brightness * 255.0 + 0.5);
	            break;
	         case 4:
	            red   = (t * 255.0 + 0.5);
	            green = (p * 255.0 + 0.5);
	            blue  = (brightness * 255.0 + 0.5);
	            break;
	          case 5:
	            red   = (brightness * 255.0 + 0.5);
	            green = (p * 255.0 + 0.5);
	            blue  = (q * 255.0 + 0.5);
	            break;
		    }
		}

	   return { r : parseInt(red,10), g : parseInt(green,10) , b : parseInt(blue,10) };
	};

	/**
	 * Converts RGB value to hue/saturation/brightness
	 * @param r integer (0-255)
	 * @param g integer (0-255)
	 * @param b integer (0-255)
	 * @returns a 3-element object: h=hue, s=saturation, b=brightness.
	 * (unlike some HSB documentation which states hue should be a value 0-360, this routine returns hue values from 0 to 1.0)
	 */
	Color.RGBtoHSB = function(r, g, b) {

	   var hue;
	   var saturation;
	   var brightness;

	   var cmax = (r > g) ? r : g;
	   if (b > cmax)
	      cmax = b;

	   var cmin = (r < g) ? r : g;
	   if (b < cmin)
	      cmin = b;

	   brightness = cmax / 255.0;
	   if (cmax != 0)
	      saturation = (cmax - cmin)/cmax;
	   else
	      saturation = 0;

	   if (saturation == 0)
	      hue = 0;
	   else {
	      var redc   = (cmax - r)/(cmax - cmin);
	    	var greenc = (cmax - g)/(cmax - cmin);
	    	var bluec  = (cmax - b)/(cmax - cmin);

	    	if (r == cmax)
	    	   hue = bluec - greenc;
	    	else if (g == cmax)
	    	   hue = 2.0 + redc - bluec;
	      else
	    	   hue = 4.0 + greenc - redc;

	    	hue = hue / 6.0;
	    	if (hue < 0)
	    	   hue = hue + 1.0;
	   }

	   return { h : hue, s : saturation, b : brightness };
	};

	Color.setColorHue = function(originColor,opacityPercent,maskRGB) {
	  return new RGBColor(
	    Math.round(originColor.rgb.r*opacityPercent + maskRGB.rgb.r*(1.0-opacityPercent)),
	    Math.round(originColor.rgb.g*opacityPercent + maskRGB.rgb.g*(1.0-opacityPercent)),
	    Math.round(originColor.rgb.b*opacityPercent + maskRGB.rgb.b*(1.0-opacityPercent))
	  );
	};

	Color.nameToHex = function(s) {
	    if (s.substr(0,2) == "0x"){
	      return s.substr(2, s.length);
	    }
	    else{
	      return "#" + Color.colorNames[s];
	    }
	}

	Color.colorNames = {
	    aliceblue: 'f0f8ff',
	    antiquewhite: 'faebd7',
	    aqua: '00ffff',
	    aquamarine: '7fffd4',
	    azure: 'f0ffff',
	    beige: 'f5f5dc',
	    bisque: 'ffe4c4',
	    black: '000000',
	    blanchedalmond: 'ffebcd',
	    blue: '0000ff',
	    blueviolet: '8a2be2',
	    brown: 'a52a2a',
	    burlywood: 'deb887',
	    cadetblue: '5f9ea0',
	    chartreuse: '7fff00',
	    chocolate: 'd2691e',
	    coral: 'ff7f50',
	    cornflowerblue: '6495ed',
	    cornsilk: 'fff8dc',
	    crimson: 'dc143c',
	    cyan: '00ffff',
	    darkblue: '00008b',
	    darkcyan: '008b8b',
	    darkgoldenrod: 'b8860b',
	    darkgray: 'a9a9a9',
	    darkgreen: '006400',
	    darkkhaki: 'bdb76b',
	    darkmagenta: '8b008b',
	    darkolivegreen: '556b2f',
	    darkorange: 'ff8c00',
	    darkorchid: '9932cc',
	    darkred: '8b0000',
	    darksalmon: 'e9967a',
	    darkseagreen: '8fbc8f',
	    darkslateblue: '483d8b',
	    darkslategray: '2f4f4f',
	    darkturquoise: '00ced1',
	    darkviolet: '9400d3',
	    deeppink: 'ff1493',
	    deepskyblue: '00bfff',
	    dimgray: '696969',
	    dodgerblue: '1e90ff',
	    feldspar: 'd19275',
	    firebrick: 'b22222',
	    floralwhite: 'fffaf0',
	    forestgreen: '228b22',
	    fuchsia: 'ff00ff',
	    gainsboro: 'dcdcdc',
	    ghostwhite: 'f8f8ff',
	    gold: 'ffd700',
	    goldenrod: 'daa520',
	    gray: '808080',
	    green: '008000',
	    greenyellow: 'adff2f',
	    honeydew: 'f0fff0',
	    hotpink: 'ff69b4',
	    indianred : 'cd5c5c',
	    indigo : '4b0082',
	    ivory: 'fffff0',
	    khaki: 'f0e68c',
	    lavender: 'e6e6fa',
	    lavenderblush: 'fff0f5',
	    lawngreen: '7cfc00',
	    lemonchiffon: 'fffacd',
	    lightblue: 'add8e6',
	    lightcoral: 'f08080',
	    lightcyan: 'e0ffff',
	    lightgoldenrodyellow: 'fafad2',
	    lightgrey: 'd3d3d3',
	    lightgreen: '90ee90',
	    lightpink: 'ffb6c1',
	    lightsalmon: 'ffa07a',
	    lightseagreen: '20b2aa',
	    lightskyblue: '87cefa',
	    lightslateblue: '8470ff',
	    lightslategray: '778899',
	    lightsteelblue: 'b0c4de',
	    lightyellow: 'ffffe0',
	    lime: '00ff00',
	    limegreen: '32cd32',
	    linen: 'faf0e6',
	    magenta: 'ff00ff',
	    maroon: '800000',
	    mediumaquamarine: '66cdaa',
	    mediumblue: '0000cd',
	    mediumorchid: 'ba55d3',
	    mediumpurple: '9370d8',
	    mediumseagreen: '3cb371',
	    mediumslateblue: '7b68ee',
	    mediumspringgreen: '00fa9a',
	    mediumturquoise: '48d1cc',
	    mediumvioletred: 'c71585',
	    midnightblue: '191970',
	    mintcream: 'f5fffa',
	    mistyrose: 'ffe4e1',
	    moccasin: 'ffe4b5',
	    navajowhite: 'ffdead',
	    navy: '000080',
	    oldlace: 'fdf5e6',
	    olive: '808000',
	    olivedrab: '6b8e23',
	    orange: 'ffa500',
	    orangered: 'ff4500',
	    orchid: 'da70d6',
	    palegoldenrod: 'eee8aa',
	    palegreen: '98fb98',
	    paleturquoise: 'afeeee',
	    palevioletred: 'd87093',
	    papayawhip: 'ffefd5',
	    peachpuff: 'ffdab9',
	    peru: 'cd853f',
	    pink: 'ffc0cb',
	    plum: 'dda0dd',
	    powderblue: 'b0e0e6',
	    purple: '800080',
	    red: 'ff0000',
	    rosybrown: 'bc8f8f',
	    royalblue: '4169e1',
	    saddlebrown: '8b4513',
	    salmon: 'fa8072',
	    sandybrown: 'f4a460',
	    seagreen: '2e8b57',
	    seashell: 'fff5ee',
	    sienna: 'a0522d',
	    silver: 'c0c0c0',
	    skyblue: '87ceeb',
	    slateblue: '6a5acd',
	    slategray: '708090',
	    snow: 'fffafa',
	    springgreen: '00ff7f',
	    steelblue: '4682b4',
	    tan: 'd2b48c',
	    teal: '008080',
	    thistle: 'd8bfd8',
	    tomato: 'ff6347',
	    turquoise: '40e0d0',
	    violet: 'ee82ee',
	    violetred: 'd02090',
	    wheat: 'f5deb3',
	    white: 'ffffff',
	    whitesmoke: 'f5f5f5',
	    yellow: 'ffff00',
	    yellowgreen: '9acd32'
	};
	
	return Color;
	
})();