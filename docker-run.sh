#!/bin/sh

SRC_DIR=/root/auto-sort-bookmarks-webext

docker run \
    -v $(pwd):${SRC_DIR} \
    -it \
    asb-dev \
    bash
