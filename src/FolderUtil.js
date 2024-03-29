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

/* eslint-disable no-param-reassign */

import BrowserUtil from "./BrowserUtil";
import NodeUtil from "./NodeUtil";
import Separator from "./Separator";

/**
 * Class to manage Folder objects.
 */
export default class FolderUtil {
  /**
   * Get the immediate children.
   *
   * @param {*} callback The callback function.
   * @param {*} compare The compare function.
   */
  getChildren(callback, compare, resolve) {
    this.children = [[]];
    const self = this;

    BrowserUtil.getBookmarkChildren(this.id, (o) => {
      if (typeof o !== "undefined") {
        const promiseAry = [];

        o.forEach((node) => {
          if (NodeUtil.getNodeType(node) === "bookmark") {
            // history.getVisits() is faster than history.search() because
            // history.search() checks title and url, plus does not match url exactly, so it takes longer.
            // chrome expects a callback to be the second argument, while browser-api doesn't and returns promise.
            const p = BrowserUtil.getHistoryVisits({
              url: node.url,
            });
            promiseAry.push(p);
          } else {
            promiseAry.push(Promise.resolve());
          }
        });

        Promise.all(promiseAry).then((values) => {
          // populate nodes with visit information
          for (let i = 0; i < values.length; i += 1) {
            if (typeof values[i] !== "undefined" && values[i].length > 0) {
              o[i].accessCount = values[i].length;
              o[i].lastVisited = values[i][0].visitTime;
            }
          }

          let index = 0;

          o.forEach((node) => {
            const item = NodeUtil.createItemFromNode(node);
            if (item instanceof Separator) {
              // create sub-array to store nodes after separator
              self.children.push([]);
              index += 1;
            } else if (typeof item !== "undefined") {
              self.children[index].push(item);
            }
          });

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

    BrowserUtil.getBookmarkSubTree(
      this.id,
      (function getFolders() {
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

            o.forEach((node) => {
              if (
                NodeUtil.getNodeType(node) === "folder" &&
                !Annotations.isRecursivelyExcluded(node.id)
              ) {
                folder = NodeUtil.createItemFromNode(node);
                if (self.id === node.id) {
                  isTop = true;
                }

                self.folders.push(folder);
                getSubFolders(node.children);
              }
            });

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
   * Get the children folders of a folder.
   *
   * @param {string} parentId The parent ID.
   * @returns {Array}
   */
  static getChildrenFolders(parentId, callback) {
    BrowserUtil.getBookmarkChildren(parentId, (o) => {
      if (typeof o !== "undefined") {
        const children = [];
        o.forEach((node) => {
          if (NodeUtil.getNodeType(node) === "folder") {
            children.push({
              id: node.id,
              parentId: node.parentId,
              title: node.title,
              excluded: Annotations.hasDoNotSortAnnotation(node.id),
              recursivelyExcluded: Annotations.hasRecursiveAnnotation(node.id),
            });
          }
        });

        if (typeof callback === "function") {
          callback(children);
        }
      }
    });
  }
}
