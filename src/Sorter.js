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

import AsbUtil from "./AsbUtil";
import ChangeHandler from "./ChangeHandler";
import NodeUtil from "./NodeUtil";

/**
 * Sorter class.
 */
export default class Sorter {
  /**
   * Get a Sorter.
   */
  constructor() {
    /**
     * Indicates if sorting is in progress.
     */
    this.sorting = false;

    /**
     * Indicates if waiting for activity to stop.
     */
    this.isWaiting = false;

    /**
     * Last time checked for change
     */
    this.lastCheck = Date.now();

    /**
     * Handle bookmark changes
     */
    this.changeHandler = new ChangeHandler(this);
  }

  /**
   * Convert a string to an integer.
   *
   * @param {string} val String value to convert.
   * @returns {number}
   */
  parseInteger(val) {
    return parseInt(val, 10);
  }

  /**
   * Reverse the base of an URL to do a better sorting.
   *
   * @param str The URL to be reversed.
   * @returns{*} The reversed URL.
   */
  reverseBaseUrl(str) {
    if (!str) {
      return "";
    }

    str = str.replace(/^\S+:\/\//, "");
    const re = /^[^/]+$|^[^/]+/;
    const m = re.exec(str);

    if (m !== null) {
      if (m.index === re.lastIndex) {
        re.lastIndex++;
      }

      // Replace the found string by it's reversion
      str = str.replace(m[0], m[0].split(".").reverse().join("."));
    }

    return str;
  }

  /**
   * Get the children folders of a folder.
   *
   * @param {string} parentId The parent ID.
   * @returns {Array}
   */
  getChildrenFolders(parentId, callback) {
    chrome.bookmarks.getChildren(parentId, (o) => {
      if (typeof o !== "undefined") {
        const children = [];
        for (const node of o) {
          if (getNodeType(node) === "folder") {
            children.push({
              id: node.id,
              parentId: node.parentId,
              title: node.title,
              excluded: Annotations.hasDoNotSortAnnotation(node.id),
              recursivelyExcluded: Annotations.hasRecursiveAnnotation(node.id),
            });
          }
        }

        if (typeof callback === "function") {
          callback(children);
        }
      }
    });
  }

  /**
   * Create a bookmark comparator.
   *
   * @returns {*} The comparator.
   */
  createCompare() {
    let comparator;

    /**
     * Check for corrupted and order flags.
     *
     * @param bookmark1
     * @param bookmark2
     * @returns {number}
     */
    function checkCorruptedAndOrder(bookmark1, bookmark2) {
      if (bookmark1.corrupted) {
        if (bookmark2.corrupted) {
          return 0;
        }

        return 1;
      }
      if (bookmark2.corrupted) {
        return -1;
      }

      if (bookmark1.order !== bookmark2.order) {
        return bookmark1.order - bookmark2.order;
      }
    }

    /**
     * Add reverse URLs.
     *
     * @param bookmark1
     * @param bookmark2
     * @param criteria
     */
    function addReverseUrls(bookmark1, bookmark2, criteria) {
      if (criteria === "revurl") {
        bookmark1.revurl = reverseBaseUrl(bookmark1.url);
        bookmark2.revurl = reverseBaseUrl(bookmark2.url);
      }
    }

    /**
     * Add host names.
     *
     * @param bookmark1
     * @param bookmark2
     * @param criteria
     */
    function addHostNames(bookmark1, bookmark2, criteria) {
      if (criteria === "hostname") {
        bookmark1.hostname = new URL(bookmark1.url).hostname;
        bookmark2.hostname = new URL(bookmark2.url).hostname;
      }
    }

    const compareOptions = {
      caseFirst: "upper",
      numeric: true,
      sensitivity: "case",
    };

    if (Sorter.prototype.caseInsensitive) {
      compareOptions.sensitivity = "base";
    }

    let firstComparator;
    if (
      ["title", "url", "revurl", "hostname"].indexOf(
        Sorter.prototype.firstSortCriteria
      ) !== -1
    ) {
      firstComparator = function (bookmark1, bookmark2) {
        addReverseUrls(
          bookmark1,
          bookmark2,
          Sorter.prototype.firstSortCriteria
        );
        addHostNames(bookmark1, bookmark2, Sorter.prototype.firstSortCriteria);
        return (
          bookmark1[Sorter.prototype.firstSortCriteria].localeCompare(
            bookmark2[Sorter.prototype.firstSortCriteria],
            undefined,
            compareOptions
          ) * Sorter.prototype.firstReverse
        );
      };
    } else {
      // sort numerically: dateAdded, lastModified, accessCount, lastVisited
      firstComparator = function (bookmark1, bookmark2) {
        return (
          (bookmark1[Sorter.prototype.firstSortCriteria] -
            bookmark2[Sorter.prototype.firstSortCriteria]) *
          Sorter.prototype.firstReverse
        );
      };
    }

    let secondComparator;
    if (
      typeof Sorter.prototype.secondSortCriteria !== "undefined" &&
      Sorter.prototype.secondSortCriteria !== "none"
    ) {
      if (
        ["title", "url", "revurl", "hostname"].indexOf(
          Sorter.prototype.secondSortCriteria
        ) !== -1
      ) {
        secondComparator = function (bookmark1, bookmark2) {
          addReverseUrls(
            bookmark1,
            bookmark2,
            Sorter.prototype.secondSortCriteria
          );
          addHostNames(
            bookmark1,
            bookmark2,
            Sorter.prototype.firstSortCriteria
          );
          return (
            bookmark1[Sorter.prototype.secondSortCriteria].localeCompare(
              bookmark2[Sorter.prototype.secondSortCriteria],
              undefined,
              compareOptions
            ) * Sorter.prototype.secondReverse
          );
        };
      } else {
        // sort numerically: dateAdded, lastModified, accessCount, lastVisited
        secondComparator = function (bookmark1, bookmark2) {
          return (
            (bookmark1[Sorter.prototype.secondSortCriteria] -
              bookmark2[Sorter.prototype.secondSortCriteria]) *
            Sorter.prototype.secondReverse
          );
        };
      }
    } else {
      // no sorting
      secondComparator = function () {
        return 0;
      };
    }

    // combine the first and second comparators
    const itemComparator = function (bookmark1, bookmark2) {
      return (
        firstComparator(bookmark1, bookmark2) ||
        secondComparator(bookmark1, bookmark2)
      );
    };

    if (Sorter.prototype.differentFolderOrder) {
      if (
        typeof Sorter.prototype.folderSortCriteria !== "undefined" &&
        Sorter.prototype.folderSortCriteria !== "none"
      ) {
        // sort folders, then sort bookmarks
        comparator = function (bookmark1, bookmark2) {
          if (bookmark1 instanceof Folder && bookmark2 instanceof Folder) {
            if (["title"].indexOf(Sorter.prototype.folderSortCriteria) !== -1) {
              return (
                bookmark1[Sorter.prototype.folderSortCriteria].localeCompare(
                  bookmark2[Sorter.prototype.folderSortCriteria],
                  undefined,
                  compareOptions
                ) * Sorter.prototype.folderReverse
              );
            }

            // numeric sort
            return (
              (bookmark1[Sorter.prototype.folderSortCriteria] -
                bookmark2[Sorter.prototype.folderSortCriteria]) *
              Sorter.prototype.folderReverse
            );
          }

          return itemComparator(bookmark1, bookmark2);
        };
      } else {
        // no sorting
        comparator = function (bookmark1, bookmark2) {
          if (bookmark1 instanceof Folder && bookmark2 instanceof Folder) {
            return 0;
          }

          return itemComparator(bookmark1, bookmark2);
        };
      }
    } else {
      // sort bookmarks and folders with same order
      comparator = itemComparator;
    }

    return function (bookmark1, bookmark2) {
      const result = checkCorruptedAndOrder(bookmark1, bookmark2);
      if (typeof result === "undefined") {
        return comparator(bookmark1, bookmark2);
      }

      return result;
    };
  }

  /**
   * Sort all bookmarks.
   */
  sortAllBookmarks() {
    const self = this;
    getChildrenFolders(this.getRootId(), (children) => {
      self.sortRootFolders(children);
    });
  }

  /**
   * Sort root folders.
   *
   * @param children
   */
  sortRootFolders(children) {
    const promiseAry = [];

    children.forEach((node) => {
      const folder = NodeUtil.createItemFromNode(node);

      const p = new Promise((resolve) => {
        const folders = [];

        if (!node.recursivelyExcluded) {
          folders.push(folder);

          folder.getFolders((subfolders) => {
            subfolders.forEach((f) => folders.push(f));
            resolve(folders);
          });
        } else {
          resolve(folders);
        }
      });

      promiseAry.push(p);
    });

    Promise.all(promiseAry).then((folders) => {
      // Flatten array of arrays into array
      const mergedFolders = [].concat.apply([], folders);

      Annotations.removeMissingFolders(mergedFolders);
      this.sortFolders(mergedFolders);
    });
  }

  /**
   * Set sort criteria.
   *
   * @param {any} firstSortCriteria
   * @param {any} firstReverse
   * @param {any} secondSortCriteria
   * @param {any} secondReverse
   * @param {any} folderSortCriteria
   * @param {any} folderReverse
   * @param {any} differentFolderOrder
   * @param {any} caseInsensitive
   * @memberof Sorter
   */
  setCriteria(
    firstSortCriteria,
    firstReverse,
    secondSortCriteria,
    secondReverse,
    folderSortCriteria,
    folderReverse,
    differentFolderOrder,
    caseInsensitive
  ) {
    Sorter.prototype.firstReverse = firstReverse ? -1 : 1;
    Sorter.prototype.firstSortCriteria = firstSortCriteria;
    Sorter.prototype.secondReverse = secondReverse ? -1 : 1;
    Sorter.prototype.secondSortCriteria = secondSortCriteria;
    Sorter.prototype.folderReverse = folderReverse ? -1 : 1;
    Sorter.prototype.folderSortCriteria = folderSortCriteria;
    Sorter.prototype.differentFolderOrder = differentFolderOrder;
    Sorter.prototype.caseInsensitive = caseInsensitive;
    this.compare = this.createCompare();
  }

  /**
   * Sort and save a folder.
   *
   * @param {Folder} folder The folder to sort and save.
   */
  sortAndSave(folder, resolve) {
    if (folder.canBeSorted()) {
      folder.getChildren(this.sortFolder, this.compare, resolve);
    } else if (typeof resolve === "function") {
      resolve();
    }
  }

  /**
   * Sort the `folder` children.
   *
   * @param {Folder} folder The folder to sort.
   */
  sortFolder(folder, compare, resolve) {
    let delta = 0;
    let length;

    // children is an array of arrays where a separator node is used to separate lists
    for (let i = 0; i < folder.children.length; i += 1) {
      // sort each array of nodes
      folder.children[i].sort(compare);
      // assign new index to each node
      length = folder.children[i].length;
      for (let j = 0; j < length; j += 1) {
        folder.children[i][j].setIndex(j + delta);
      }

      delta += length + 1;
    }

    // move nodes based on new index
    folder.save(resolve);
  }

  /**
   * Sort the `folders`.
   *
   * @param folders The folders to sort.
   */
  sortFolders(folders) {
    // convert single folder into array of folders
    folders = folders instanceof Folder ? [folders] : folders;

    const self = this;
    const promiseAry = [];

    folders.forEach((folder) => {
      // create an array of promises
      const p = new Promise((resolve) => {
        self.sortAndSave(folder, resolve);
      });

      promiseAry.push(p);
    });

    Promise.all(promiseAry).then(() => {
      AsbUtil.log("sort:end");
      self.sorting = false;
      self.lastCheck = Date.now();
      // wait for events caused by sorting to finish before listening again so the sorting is not triggered again
      setTimeout(
        () => {
          this.changeHandler.createChangeListeners();
        },
        3000,
        "Javascript"
      );
    });
  }

  /**
   * Sort all bookmarks.
   */
  sortNow() {
    this.sortIfNotSorting();
  }

  /**
   * Sort if the auto sort option is on.
   */
  sortIfAuto() {
    if (getPref("auto_sort")) {
      this.sortNow();
    }
  }

  /**
   * Sort if not already sorting.
   */
  sortIfNotSorting() {
    if (!this.sorting) {
      // restart clock every time there is an event triggered
      this.lastCheck = Date.now();
      // if already waiting, then don't wait again or there will be multiple loops
      if (!this.isWaiting) {
        this.sortIfNoChanges();
      }
    }
  }

  /**
   * Sort if no recent changes.
   */
  sortIfNoChanges() {
    if (!this.sorting) {
      // wait for a period of no activity before sorting
      const now = Date.now();
      const diff = now - this.lastCheck;
      const delay = this.parseInteger(getPref("delay")) * 1000;
      if (diff < delay) {
        this.isWaiting = true;
        const self = this;
        setTimeout(
          () => {
            log("waiting one second for activity to stop");
            self.sortIfNoChanges();
          },
          1000,
          "Javascript"
        );
      } else {
        this.sorting = true;
        this.isWaiting = false;
        this.changeHandler.removeChangeListeners();
        AsbUtil.log("sort:begin");
        this.sortAllBookmarks();
      }
    }
  }
}
