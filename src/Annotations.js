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

/**
 * Singleton that manages per-folder sort-exclusion annotations.
 *
 * Two independent flags are stored in `browser.storage.local`:
 * - **donotsort** – the folder is excluded from sorting.
 * - **recursive** – combined with donotsort, the folder *and all its
 *   descendants* are excluded from sorting.
 *
 * Both flags are stored as `{ [folderId]: true }` maps under their
 * respective storage keys.
 *
 * @namespace Annotations
 */
const Annotations = (function () {
  /** @type {string} Storage key for the do-not-sort flag map. */
  const DO_NOT_SORT = "donotsort";

  /** @type {string} Storage key for the recursive-exclusion flag map. */
  const RECURSIVE = "recursive";

  /** @type {Object} In-memory mirror of the full storage snapshot loaded at startup. */
  let storedSettings = {};

  /**
   * Persists the current annotation flags to storage.
   * Only the annotation keys are written; the prefs key is never touched.
   */
  function save() {
    browser.storage.local.set({
      [DO_NOT_SORT]: storedSettings[DO_NOT_SORT] || {},
      [RECURSIVE]: storedSettings[RECURSIVE] || {},
    });
  }

  return {
    /**
     * Initialises the in-memory store from the full storage snapshot.
     * Called once during extension startup by {@link AsbPrefs.load}.
     * @param {Object} settings - The raw object returned by `browser.storage.local.get(null)`.
     */
    init(settings) {
      storedSettings = settings || {};
    },

    /**
     * Returns true if the folder has the do-not-sort flag set.
     * @param {string} id - Bookmark folder ID.
     * @returns {boolean}
     */
    hasDoNotSortAnnotation(id) {
      return !!(storedSettings[DO_NOT_SORT] && storedSettings[DO_NOT_SORT][id]);
    },

    /**
     * Returns true if the folder has the recursive-exclusion flag set.
     * @param {string} id - Bookmark folder ID.
     * @returns {boolean}
     */
    hasRecursiveAnnotation(id) {
      return !!(storedSettings[RECURSIVE] && storedSettings[RECURSIVE][id]);
    },

    /**
     * Returns true if the folder and all its descendants should be excluded
     * from sorting. Requires both the do-not-sort and recursive flags to be set.
     * @param {string} id - Bookmark folder ID.
     * @returns {boolean}
     */
    isRecursivelyExcluded(id) {
      return this.hasDoNotSortAnnotation(id) && this.hasRecursiveAnnotation(id);
    },

    /**
     * Removes a single annotation flag for a folder and persists the change.
     * @param {string} name - Storage key (`DO_NOT_SORT` or `RECURSIVE`).
     * @param {string} id   - Bookmark folder ID.
     */
    removeItemAnnotation(name, id) {
      if (storedSettings[name] && typeof storedSettings[name][id] !== "undefined") {
        delete storedSettings[name][id];
        save();
      }
    },

    /**
     * Removes all annotation flags for folders that no longer exist in the
     * bookmark tree, cleaning up stale storage entries.
     * @param {Object[]} folders - Array of currently known folder items, each with an `id` property.
     */
    removeMissingFolders(folders) {
      this.removeMissingFoldersForItem(DO_NOT_SORT, folders);
      this.removeMissingFoldersForItem(RECURSIVE, folders);
    },

    /**
     * Removes entries from one annotation map whose IDs are not present in `folders`.
     * @param {string}   name    - Storage key to clean up.
     * @param {Object[]} folders - Array of currently known folder items.
     */
    removeMissingFoldersForItem(name, folders) {
      if (storedSettings[name]) {
        Object.keys(storedSettings[name]).forEach((id) => {
          const found = folders.find((folder) => folder.id === id);
          if (typeof found === "undefined") {
            this.removeItemAnnotation(name, id);
          }
        });
      }
    },

    /**
     * Clears the do-not-sort flag for a folder.
     * @param {string} id - Bookmark folder ID.
     */
    removeDoNotSortAnnotation(id) {
      this.removeItemAnnotation(DO_NOT_SORT, id);
    },

    /**
     * Clears the recursive-exclusion flag for a folder.
     * @param {string} id - Bookmark folder ID.
     */
    removeRecursiveAnnotation(id) {
      this.removeItemAnnotation(RECURSIVE, id);
    },

    /**
     * Sets an annotation flag for a folder and persists the change.
     * @param {string} name  - Storage key (`DO_NOT_SORT` or `RECURSIVE`).
     * @param {string} id    - Bookmark folder ID.
     * @param {*}      value - Value to store (typically `true`).
     */
    setItemAnnotation(name, id, value) {
      if (!storedSettings[name]) {
        storedSettings[name] = {};
      }
      storedSettings[name][id] = value;
      save();
    },

    /**
     * Sets the do-not-sort flag for a folder.
     * @param {string} id - Bookmark folder ID.
     */
    setDoNotSortAnnotation(id) {
      this.setItemAnnotation(DO_NOT_SORT, id, true);
    },

    /**
     * Sets the recursive-exclusion flag for a folder.
     * @param {string} id - Bookmark folder ID.
     */
    setRecursiveAnnotation(id) {
      this.setItemAnnotation(RECURSIVE, id, true);
    },
  };
})();

// eslint-disable-next-line no-undef
if (typeof module !== "undefined") module.exports = Annotations;
