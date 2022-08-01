#!/bin/sh

ASB_VER=`grep \"version\" src/manifest.json|cut -d'"' -f4`
SRC_DIR=/root/auto-sort-bookmarks-webext
BLD_DIR=${SRC_DIR}/build
XPI_FILE=${SRC_DIR}/auto-sort_bookmarks-${ASB_VER}.xpi

echo Cleaning...
./clean.sh

echo
echo Building...
docker build -t asb .

echo
echo Copying...
id=$(docker create asb)
if [ -n "$id" ]
then
    docker cp $id:${BLD_DIR} .
    docker cp $id:${XPI_FILE} .
    docker rm -v $id
fi

echo
echo Done.

