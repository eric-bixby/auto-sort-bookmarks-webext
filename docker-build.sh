#!/bin/sh

echo Cleaning...
./clean.sh
docker images -q asb | xargs docker rmi -f

echo
echo Building image...
docker build -t asb .

echo
echo Building xpi...
./docker-xpi.sh

echo
echo Done.

