#!/bin/sh

echo Cleaning...
./clean.sh

echo
echo Building...
./build.sh

echo
echo Archiving...
cd build
web-ext build -a ..
cd ..

echo
for file in *.zip
do
  echo Renaming "$file" to "${file%.zip}.xpi"
  mv "$file" "${file%.zip}.xpi"
done

echo
echo Done.

