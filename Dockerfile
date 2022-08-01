# Install base OS
FROM ubuntu:18.04

# Replace shell with bash so we can source files
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# Set workdir
ENV HOME /root
ENV SRC_DIR ${HOME}/auto-sort-bookmarks-webext
WORKDIR $HOME

# Install curl
RUN apt-get update && apt-get install -y curl

# Copy everything to container
COPY . ${SRC_DIR}

# Install node and npm (weh requires 12.x)
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash
RUN apt-get install -y nodejs

# Install dependencies (allow root, otherwise, get premission error)
RUN npm i -g --unsafe-perm=true --alow-root \
        web-ext@6.8.0 \
        gulp@4.0.2 \
        weh@2.10.0

# Apply npm-shrinkwrap to weh
RUN cd `npm root -g`/weh \
    && cp ${SRC_DIR}/weh-npm-shrinkwrap.json ./npm-shrinkwrap.json \
    && npm i

# Build XPI
RUN cd ${SRC_DIR} && ./build_ff.sh

