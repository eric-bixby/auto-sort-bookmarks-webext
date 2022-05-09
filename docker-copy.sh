#!/bin/sh

ASB_VER=3.4.3
XPI_FILE=auto-sort_bookmarks-${ASB_VER}.xpi

id=$(docker create asb)
docker cp $id:/root/auto-sort-bookmarks-webext-${ASB_VER}/${XPI_FILE} - > ${XPI_FILE}
docker rm -v $id

