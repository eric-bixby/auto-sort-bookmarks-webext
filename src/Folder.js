/*
 * Copyright (C) 2014-2015  Boucher, Antoni <bouanto@zoho.com>
 * Copyright (C) 2016-2022  Eric Bixby <ebixby@yahoo.com>
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

import AsbPrefs from "./AsbPrefs";
import Bookmark from "./Bookmark";
import Sorter from "./Sorter";

/**
 * Folder class.
 */
export default class Folder extends Bookmark {
  /**
   * Get a folder.
   *
   * @param {string} id The folder identifier.
   * @param {int} index The folder position.
   * @param {string} parentId The folder parent identifier.
   * @param {string} title The folder title.
   * @param {int} dateAdded The timestamp of the date added.
   * @param {int} lastModified The timestamp of the last modified date.
   */
  constructor(id, index, parentId, title, dateAdded, lastModified) {
    super(id, index, parentId, title, dateAdded, lastModified);

    this.order = AsbPrefs.getPref("folder_sort_order");
  }

  /**
   * Check if this folder can be sorted.
   *
   * @return {boolean} Whether it can be sorted or not.
   */
  canBeSorted() {
    if (
      tags.hasDoNotSortAnnotation(this.id) ||
      tags.isRecursivelyExcluded(this.id)
    ) {
      return false;
    }
    return !this.isRoot();
  }

  /**
   * Get the immediate children.
   *
   * @param {*} callback The callback function.
   * @param {*} compare The compare function.
   */
  getChildren(callback, compare, resolve) {
    this.children = [[]];
    const self = this;

    chrome.bookmarks.getChildren(this.id, (o) => {
      if (typeof o !== "undefined") {
        const promiseAry = [];

        for (const node of o) {
          if (getNodeType(node) === "bookmark") {
            // history.getVisits() is faster than history.search() because
            // history.search() checks title and url, plus does not match url exactly, so it takes longer.
            // chrome expects a callback to be the second argument, while browser-api doesn't and returns promise.
            const p = browser.history.getVisits({
              url: node.url,
            });
            promiseAry.push(p);
          } else {
            promiseAry.push(Promise.resolve());
          }
        }

        Promise.all(promiseAry).then((values) => {
          // populate nodes with visit information
          for (let i = 0; i < values.length; i++) {
            if (typeof values[i] !== "undefined" && values[i].length > 0) {
              o[i].accessCount = values[i].length;
              o[i].lastVisited = values[i][0].visitTime;
            }
          }

          let index = 0;

          for (const node of o) {
            const item = createItemFromNode(node);
            if (item instanceof Separator) {
              // create sub-array to store nodes after separator
              self.children.push([]);
              ++index;
            } else if (typeof item !== "undefined") {
              self.children[index].push(item);
            }
          }

          if (typeof callback === "function") {
            callback(self, compare, resolve);
          }
        });
      } else if (typeof resolve === "function") {
        resolve();
      }
    });
  }

  /**
   * Get folders recursively.
   *
   * @param {*} callback The callback function.
   */
  getFolders(callback) {
    this.folders = [];
    const self = this;

    chrome.bookmarks.getSubTree(
      this.id,
      (function () {
        /**
         * Get sub folders. Defined locally so that it can be called recursively and not blow the stack.
         *
         * @param {*} List of bookmarks.
         * @returns {*} Callback.
         */
        function getSubFolders(o) {
          if (typeof o !== "undefined") {
            let folder;
            let isTop = false;

            for (const node of o) {
              if (
                getNodeType(node) === "folder" &&
                !tags.isRecursivelyExcluded(node.id)
              ) {
                folder = createItemFromNode(node);
                if (self.id === node.id) {
                  isTop = true;
                }

                self.folders.push(folder);
                getSubFolders(node.children);
              }
            }

            // only return the complete list if this is the top iteration
            if (isTop && typeof callback === "function") {
              callback(self.folders);
            }
          }
        }
        return getSubFolders;
      })()
    );
  }

  /**
   * Check if this folder is the root folder.
   *
   * @return {boolean} Whether this is a root folder or not.
   */
  isRoot() {
    return this.id === Sorter.getRootId();
  }

  /**
   * Check if at least one children has moved.
   *
   * @return {boolean} Whether at least one children has moved or not.
   */
  hasMove() {
    for (let i = 0; i < this.children.length; ++i) {
      const { length } = this.children[i];
      for (let j = 0; j < length; ++j) {
        if (this.children[i][j].index !== this.children[i][j].oldIndex) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Save the new children positions.
   */
  save(resolve) {
    if (this.hasMove()) {
      const promiseAry = [];

      for (let i = 0; i < this.children.length; ++i) {
        const { length } = this.children[i];
        for (let j = 0; j < length; ++j) {
          const p = this.children[i][j].saveIndex();
          promiseAry.push(p);
        }
      }

      Promise.all(promiseAry).then(() => {
        if (typeof resolve === "function") {
          resolve();
        }
      });
    } else if (typeof resolve === "function") {
      resolve();
    }
  }
}
