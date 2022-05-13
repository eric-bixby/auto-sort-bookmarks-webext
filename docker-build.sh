#!/bin/sh

ASB_VER=3.4.5
SRC_DIR=/root/auto-sort-bookmarks-webext-${ASB_VER}
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
docker cp $id:${BLD_DIR} .
docker cp $id:${XPI_FILE} .
docker rm -v $id

echo
echo Done.

