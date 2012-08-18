#!/bin/bash
cat source/graphy.core.js source/graphy.filters.js source/graphy.formatters.js source/graphy.interval.js source/graphy.util.js source/graphy.color.js source/graphy.renderers.js > graphy.js
cat source/require-prefix.js graphy.js source/require-suffix.js > require-graphy.js