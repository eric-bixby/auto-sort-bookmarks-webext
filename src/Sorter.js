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

import AsbUtil from "./AsbUtil";
import ChangeHandler from "./ChangeHandler";
import Folder from "./Folder";
import FolderUtil from "./FolderUtil";
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
   * Sort all bookmarks.
   */
  sortAllBookmarks() {
    const self = this;
    FolderUtil.getChildrenFolders(this.getRootId(), (children) => {
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
      // Flatten array of arrays into single array using spread operator (...)
      const mergedFolders = [].concat(...folders);

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
    this.compare = Sorter.createCompare();
  }

  /**
   * Sort and save a folder.
   *
   * @param {Folder} folder The folder to sort and save.
   */
  sortAndSave(folder, resolve) {
    if (folder.canBeSorted()) {
      folder.getChildren(Sorter.sortFolder, this.compare, resolve);
    } else if (typeof resolve === "function") {
      resolve();
    }
  }

  /**
   * Sort the `folder` children.
   *
   * @param {Folder} folder The folder to sort.
   */
  static sortFolder(folder, compare, resolve) {
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
    if (AsbPref.getPref("auto_sort")) {
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
      const delay = parseInt(AsbPref.getPref("delay"), 10) * 1000;
      if (diff < delay) {
        this.isWaiting = true;
        const self = this;
        setTimeout(
          () => {
            AsbUtil.log("waiting one second for activity to stop");
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
