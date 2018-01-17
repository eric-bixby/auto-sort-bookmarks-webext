#!/bin/sh

rm -rf *.zip *.xpi

echo
echo Building...
./build.sh

echo
echo Archiving...
cd build
web-ext build -a ..
cd ..
for file in *.zip
do
 mv "$file" "${file%.zip}.xpi"
done

