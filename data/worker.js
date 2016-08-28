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
worker.dispatch = function(method, args = []) {
  return self[method](...args);
};
worker.postMessage = function(...args) {
  self.postMessage(...args);
};
worker.close = function() {
  self.close();
};
worker.log = function(...args) {
  dump("Worker: " + args.join(" ") + "\n");
};
self.addEventListener("message", msg => worker.handleMessage(msg));

// FIXME: Components not available to worker because not thread-safe (get not found exception)

function sortAll(folders) {
  return folders;
}
