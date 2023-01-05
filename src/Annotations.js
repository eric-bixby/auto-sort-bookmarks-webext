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

const DO_NOT_SORT = "donotsort";
const RECURSIVE = "recursive";

/**
 * Annotations class.
 */
export default class Annotations {
  // TODO: get this from AsbPrefs.js
  storedSettings = {};

  /**
   * Check if an item has a do not sort annotation.
   *
   * @param {string} id The item ID.
   * @return {boolean} Whether the item has a do not sort annotation.
   */
  hasDoNotSortAnnotation(id) {
    if (
      typeof this.storedSettings !== "undefined" &&
      typeof this.storedSettings[DO_NOT_SORT] !== "undefined" &&
      typeof this.storedSettings[DO_NOT_SORT][id] !== "undefined"
    ) {
      return this.storedSettings[DO_NOT_SORT][id];
    }
    return false;
  }

  /**
   * Check if an item has a recursive annotation.
   *
   * @param {string} id The item ID.
   * @return {boolean} Whether the item has a recursive annotation.
   *
   * @param {any} id
   */
  hasRecursiveAnnotation(id) {
    if (
      typeof this.storedSettings !== "undefined" &&
      typeof this.storedSettings[RECURSIVE] !== "undefined" &&
      typeof this.storedSettings[RECURSIVE][id] !== "undefined"
    ) {
      return this.storedSettings[RECURSIVE][id];
    }
    return false;
  }

  /**
   * Check if an item is recursively excluded.
   *
   * @param {string} id The item ID.
   * @return {boolean} Whether the item is recursively excluded.
   */
  isRecursivelyExcluded(id) {
    return this.hasDoNotSortAnnotation(id) && this.hasRecursiveAnnotation(id);
  }

  /**
   * Remove an item annotation.
   *
   * @param {string} name The item name.
   * @param {string} id The item ID.
   */
  removeItemAnnotation(name, id) {
    if (
      typeof this.storedSettings !== "undefined" &&
      typeof this.storedSettings[name] !== "undefined" &&
      typeof this.storedSettings[name][id] !== "undefined"
    ) {
      delete this.storedSettings[name][id];
      this.setStoredSettings();
    }
  }

  /**
   * Remove folders that no longer exist.
   *
   * @param {array} folders The current existing folders.
   */
  removeMissingFolders(folders) {
    this.removeMissingFoldersForItem(DO_NOT_SORT, folders);
    this.removeMissingFoldersForItem(RECURSIVE, folders);
  }

  /**
   * Remove folders that no longer exist.
   *
   * @param {string} name Name of storage item.
   * @param {array} folders The current existing folders.
   */
  removeMissingFoldersForItem(name, folders) {
    if (
      typeof this.storedSettings !== "undefined" &&
      typeof this.storedSettings[name] !== "undefined"
    ) {
      const ids = Object.keys(this.storedSettings[name]);
      ids.forEach((id) => {
        const found = folders.find((folder) => folder.id === id);
        if (typeof found !== "undefined") {
          this.removeItemAnnotation(name, id);
        }
      });
    }
  }

  /**
   * Remove the do not sort annotation on an item.
   *
   * @param {string} id The item ID.
   */
  removeDoNotSortAnnotation(id) {
    this.removeItemAnnotation(DO_NOT_SORT, id);
  }

  /**
   * Remove the recursive annotation on an item.
   *
   * @param {string} id The item ID.
   */
  removeRecursiveAnnotation(id) {
    this.removeItemAnnotation(RECURSIVE, id);
  }

  /**
   * Set an item annotation.
   *
   * @param {string} name The item name.
   * @param {string} id The item ID.
   * @param {string} value The item value.
   */
  setItemAnnotation(name, id, value) {
    if (typeof this.storedSettings !== "undefined") {
      if (typeof this.storedSettings[name] === "undefined") {
        this.storedSettings[name] = {};
      }
      this.storedSettings[name][id] = value;
      this.setStoredSettings();
    }
  }

  /**
   * Set the do not sort annotation on an item.
   *
   * @param {string} id The item ID.
   */
  setDoNotSortAnnotation(id) {
    this.setItemAnnotation(DO_NOT_SORT, id, true);
  }

  /**
   * Set the recursive annotation on an item.
   *
   * @param {string} id The item ID.
   */
  setRecursiveAnnotation(id) {
    this.setItemAnnotation(RECURSIVE, id, true);
  }

  /**
   * Set the stored annotation.
   */
  setStoredSettings() {
    browser.storage.local.set(this.storedSettings);
  }
}
