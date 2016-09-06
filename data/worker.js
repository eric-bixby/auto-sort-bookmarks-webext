/*
 * Copyright (C) 2014-2016  Boucher, Antoni <bouanto@zoho.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

importScripts("resource://gre/modules/workers/require.js");
let PromiseWorker = require("resource://gre/modules/workers/PromiseWorker.js");

let worker = new PromiseWorker.AbstractWorker();
worker.dispatch = function (method, args = []) {
  return self[method](...args);
};
worker.postMessage = function (...args) {
  self.postMessage(...args);
};
worker.close = function () {
  self.close();
};
worker.log = function (...args) {
  dump("Worker: " + args.join(" ") + "\n");
};
self.addEventListener("message", msg => worker.handleMessage(msg));

var compare = function (a, b) {
  return a.title > b.title;
}

/**
 * Sort the `folders`.
 * @param {Array.<Folder>} folders The folders to sort.
 * @returns {Array.<Folder>} The sorted folders
 */
function sortAll(folders) {
  dump("Worker: sortAll::begin\n");
  var start = new Date().getTime();

  for (let folder of folders) {
    sortFolder(folder);
  }

  var end = new Date().getTime();
  var time = end - start;
  dump("Worker: sortAll::end,elapsed=" + time + "ms\n");

  return folders;
}

/**
 * Sort the `folder` children.
 * @param {Folder} folder The folder to sort.
 */
function sortFolder(folder) {
  let delta = 0;
  let length;

  for (let i = 0; i < folder.children.length; ++i) {
    folder.children[i].sort(compare);
    length = folder.children[i].length;
    for (let j = 0; j < length; ++j) {
      let newIndex = j + delta;
      let oldIndex = folder.children[i][j].index;
      folder.children[i][j].oldIndex = oldIndex || newIndex;
      folder.children[i][j].index = newIndex;
    }

    delta += length + 1;
  }
}
