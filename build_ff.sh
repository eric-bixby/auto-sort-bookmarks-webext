#!/bin/sh

echo
echo Building...
./build.sh

cd build

echo
echo Archiving...
web-ext build -a ..

cd ..

for file in *.zip
do
 mv "$file" "${file%.zip}.xpi"
done

