#!/bin/sh

NAME=auto-sort_bookmarks-3.0

echo Building...
./build.sh

cd build

# "version_name" not supported by Firefox (warning) but still works
#grep -v version_name manifest.json | sed -e "s/\"3.0\",/\"3.0\"/" > manifest.tmp
#mv manifest.tmp manifest.json

echo
echo Building XPI...
web-ext build -a ..

cd ..

mv ${NAME}.zip ${NAME}.xpi

