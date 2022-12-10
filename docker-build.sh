#!/bin/sh

echo Cleaning...
./clean.sh
docker images -q asb-dev | xargs docker rmi -f

echo
echo Building image...
docker build -t asb-dev .

echo
echo Building xpi...
./docker-xpi.sh

echo
echo Done.

