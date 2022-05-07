#!/bin/sh

ASB_VER=3.4.3
OUT_DIR=~/temp

sudo apt install curl -y

rm -rf ${OUT_DIR}
mkdir -p ${OUT_DIR}
cd ${OUT_DIR}

curl -L https://github.com/eric-bixby/auto-sort-bookmarks-webext/releases/download/v3.4.3/auto-sort_bookmarks-${ASB_VER}.xpi --output auto-sort_bookmarks-${ASB_VER}.xpi

unzip auto-sort_bookmarks-${ASB_VER}.xpi -d auto-sort_bookmarks-${ASB_VER}

curl -L https://github.com/eric-bixby/auto-sort-bookmarks-webext/archive/refs/tags/v${ASB_VER}.zip --output v${ASB_VER}.zip

unzip v${ASB_VER}.zip

curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

nvm install 12.22.12

npm i -g web-ext
npm i -g gulp@4.0.2
npm i -g weh@2.10.0

cd `npm root -g`/weh
cp ${OUT_DIR}/auto-sort-bookmarks-webext-${ASB_VER}/weh-npm-shrinkwrap.json ./npm-shrinkwrap.json
npm i

cd ${OUT_DIR}/auto-sort-bookmarks-webext-${ASB_VER}
./build_ff.sh

diff -r build ../auto-sort_bookmarks-${ASB_VER}

