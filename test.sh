#!/bin/sh

timestamp=$( date +"%Y-%m-%d_%H-%M-%S" )

jpm -b ~/Dropbox/FirefoxVersions/Firefox-47.0.app test --tbpl > test-${timestamp}.txt

