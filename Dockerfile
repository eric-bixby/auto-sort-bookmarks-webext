# Install base OS
FROM ubuntu:18.04

# Replace shell with bash so we can source files (for node setup)
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# Install curl
RUN apt update && apt install -y curl

# Install node and npm (weh requires node 12.x)
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash
RUN apt install -y nodejs

# Install dependencies (allow root, otherwise, get premission error)
RUN npm i -g --unsafe-perm=true --alow-root \
    web-ext@6.8.0 \
    gulp@4.0.2 \
    weh@2.10.0

# Apply npm-shrinkwrap to weh
COPY weh-npm-shrinkwrap.json /root/
RUN cd `npm root -g`/weh \
    && cp /root/weh-npm-shrinkwrap.json ./npm-shrinkwrap.json \
    && npm i

