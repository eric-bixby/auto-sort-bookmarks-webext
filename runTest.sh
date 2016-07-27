#!/bin/sh

timestamp=$( date +"%Y-%m-%d_%H-%M-%S" )

jpm test --tbpl > test-${timestamp}.txt

