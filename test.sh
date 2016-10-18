#!/bin/sh

timestamp=$( date +"%Y-%m-%d_%H-%M-%S" )

jpm -b /Applications/FirefoxDeveloperEdition.app test --tbpl > test-${timestamp}.txt

