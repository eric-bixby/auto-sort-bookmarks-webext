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

import Bookmark from "./Bookmark";

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
   * @returns {boolean} Whether it can be sorted or not.
   */
  canBeSorted() {
    if (
      Annotations.hasDoNotSortAnnotation(this.id) ||
      Annotations.isRecursivelyExcluded(this.id)
    ) {
      return false;
    }
    return !this.isRoot();
  }

  /**
   * Check if this folder is the root folder.
   *
   * @returns {boolean} Whether this is a root folder or not.
   */
  isRoot() {
    return this.id === AsbPrefs.getRootId();
  }

  /**
   * Check if at least one children has moved.
   *
   * @returns {boolean} Whether at least one children has moved or not.
   */
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

  /**
   * Save the new children positions.
   */
  save(resolve) {
    if (this.hasMove()) {
      const promiseAry = [];

      for (let i = 0; i < this.children.length; i += 1) {
        const { length } = this.children[i];
        for (let j = 0; j < length; j += 1) {
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
