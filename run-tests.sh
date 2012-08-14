#!/bin/bash
node test/nodeunit/test-server.js &
PID=$!
phantomjs test/nodeunit/test-runner.js
kill $PID