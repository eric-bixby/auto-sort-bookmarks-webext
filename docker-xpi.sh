#!/bin/sh

SRC_DIR=/root/auto-sort-bookmarks-webext

docker run \
    -v $(pwd):${SRC_DIR} \
    -t asb \
    bash -c "cd ${SRC_DIR} && ./build_ff.sh"

