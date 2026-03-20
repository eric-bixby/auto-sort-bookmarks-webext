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

const Annotations = (function () {
  const DO_NOT_SORT = "donotsort";
  const RECURSIVE = "recursive";

  let storedSettings = {};

  function setStoredSettings() {
    BrowserUtil.setLocalSettings(storedSettings);
  }

  return {
    init(settings) {
      storedSettings = settings || {};
    },

    hasDoNotSortAnnotation(id) {
      return !!(
        storedSettings[DO_NOT_SORT] &&
        storedSettings[DO_NOT_SORT][id]
      );
    },

    hasRecursiveAnnotation(id) {
      return !!(
        storedSettings[RECURSIVE] &&
        storedSettings[RECURSIVE][id]
      );
    },

    isRecursivelyExcluded(id) {
      return this.hasDoNotSortAnnotation(id) && this.hasRecursiveAnnotation(id);
    },

    removeItemAnnotation(name, id) {
      if (
        storedSettings[name] &&
        typeof storedSettings[name][id] !== "undefined"
      ) {
        delete storedSettings[name][id];
        setStoredSettings();
      }
    },

    removeMissingFolders(folders) {
      this.removeMissingFoldersForItem(DO_NOT_SORT, folders);
      this.removeMissingFoldersForItem(RECURSIVE, folders);
    },

    removeMissingFoldersForItem(name, folders) {
      if (storedSettings[name]) {
        const ids = Object.keys(storedSettings[name]);
        ids.forEach((id) => {
          const found = folders.find((folder) => folder.id === id);
          if (typeof found !== "undefined") {
            this.removeItemAnnotation(name, id);
          }
        });
      }
    },

    removeDoNotSortAnnotation(id) {
      this.removeItemAnnotation(DO_NOT_SORT, id);
    },

    removeRecursiveAnnotation(id) {
      this.removeItemAnnotation(RECURSIVE, id);
    },

    setItemAnnotation(name, id, value) {
      if (!storedSettings[name]) {
        storedSettings[name] = {};
      }
      storedSettings[name][id] = value;
      setStoredSettings();
    },

    setDoNotSortAnnotation(id) {
      this.setItemAnnotation(DO_NOT_SORT, id, true);
    },

    setRecursiveAnnotation(id) {
      this.setItemAnnotation(RECURSIVE, id, true);
    },
  };
})();
