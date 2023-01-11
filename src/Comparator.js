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

export default class Comparator {
  /**
   * Create a bookmark comparator.
   *
   * @returns {*} The comparator.
   */
  static createCompare() {
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

      return 0;
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
        bookmark1.revurl = AsbUtil.reverseBaseUrl(bookmark1.url);
        bookmark2.revurl = AsbUtil.reverseBaseUrl(bookmark2.url);
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
      firstComparator = function compare(bookmark1, bookmark2) {
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
      firstComparator = function compare(bookmark1, bookmark2) {
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
        secondComparator = function compare(bookmark1, bookmark2) {
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
        secondComparator = function compare(bookmark1, bookmark2) {
          return (
            (bookmark1[Sorter.prototype.secondSortCriteria] -
              bookmark2[Sorter.prototype.secondSortCriteria]) *
            Sorter.prototype.secondReverse
          );
        };
      }
    } else {
      // no sorting
      secondComparator = function compare() {
        return 0;
      };
    }

    // combine the first and second comparators
    const itemComparator = function compare(bookmark1, bookmark2) {
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
        comparator = function compare(bookmark1, bookmark2) {
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
        comparator = function compare(bookmark1, bookmark2) {
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

    return function compare(bookmark1, bookmark2) {
      const result = checkCorruptedAndOrder(bookmark1, bookmark2);
      if (typeof result === "undefined") {
        return comparator(bookmark1, bookmark2);
      }

      return result;
    };
  }
}
