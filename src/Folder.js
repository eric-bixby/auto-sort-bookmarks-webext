/*
 * Copyright (C) 2014-2015  Boucher, Antoni <bouanto@zoho.com>
 * Copyright (C) 2016-2026  Eric Bixby <ebixby@yahoo.com>
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

class Folder extends Bookmark {
  constructor(id, index, parentId, title, dateAdded, lastModified) {
    super(id, index, parentId, title, dateAdded, lastModified);
    this.order = AsbPrefs.getFolderOrder();
  }

  canBeSorted() {
    if (
      Annotations.hasDoNotSortAnnotation(this.id) ||
      Annotations.isRecursivelyExcluded(this.id)
    ) {
      return false;
    }
    return !this.isRoot();
  }

  isRoot() {
    return this.id === AsbPrefs.getRootId();
  }

  hasMove() {
    for (let i = 0; i < this.children.length; i += 1) {
      const { length } = this.children[i];
      for (let j = 0; j < length; j += 1) {
        if (this.children[i][j].index !== this.children[i][j].oldIndex) {
          return true;
        }
      }
    }
    return false;
  }

  save(resolve) {
    if (this.hasMove()) {
      const promiseAry = [];

      for (let i = 0; i < this.children.length; i += 1) {
        const { length } = this.children[i];
        for (let j = 0; j < length; j += 1) {
          promiseAry.push(this.children[i][j].saveIndex());
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

  // Get immediate children, enriched with history visit data.
  // Populates this.children as an array of arrays (split by separators).
  getChildren(callback, compare, resolve) {
    this.children = [[]];
    const self = this;

    BrowserUtil.getBookmarkChildren(this.id).then((o) => {
      if (typeof o !== "undefined") {
        const promiseAry = [];

        o.forEach((node) => {
          if (NodeUtil.getNodeType(node) === "bookmark") {
            promiseAry.push(BrowserUtil.getHistoryVisits({ url: node.url }));
          } else {
            promiseAry.push(Promise.resolve());
          }
        });

        Promise.all(promiseAry).then((values) => {
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

  // Get all descendant folders recursively (excluding recursively-excluded branches).
  getFolders(callback) {
    this.folders = [];
    const self = this;

    function getSubFolders(o) {
      if (typeof o !== "undefined") {
        let isTop = false;

        o.forEach((node) => {
          if (
            NodeUtil.getNodeType(node) === "folder" &&
            !Annotations.isRecursivelyExcluded(node.id)
          ) {
            const folder = NodeUtil.createItemFromNode(node);
            if (self.id === node.id) {
              isTop = true;
            }
            self.folders.push(folder);
            getSubFolders(node.children);
          }
        });

        if (isTop && typeof callback === "function") {
          callback(self.folders);
        }
      }
    }

    BrowserUtil.getBookmarkSubTree(this.id).then(getSubFolders);
  }
}
