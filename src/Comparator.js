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
 * The sort criteria used to build a comparator.
 * @typedef {Object} SortCriteria
 * @property {string}  sortBy          - Primary sort field for bookmarks
 *                                       (`"title"`, `"url"`, `"dateAdded"`, `"lastModified"`,
 *                                        `"lastVisited"`, `"accessCount"`, `"revurl"`, `"hostname"`).
 * @property {boolean} inverse         - If true, reverse the primary sort direction.
 * @property {string}  thenSortBy      - Secondary sort field for bookmarks, or `"none"`.
 * @property {boolean} thenInverse     - If true, reverse the secondary sort direction.
 * @property {string}  folderSortBy    - Sort field for folders (`"title"` or `"none"`).
 * @property {boolean} folderInverse   - If true, reverse the folder sort direction.
 * @property {boolean} caseInsensitive - If true, string comparisons ignore letter case.
 */

/**
 * Creates a comparator function from the given sort criteria.
 *
 * The returned comparator can be passed directly to `Array.prototype.sort`.
 * It applies the following rules in order:
 * 1. Corrupted bookmarks always sort to the bottom.
 * 2. Items with different `order` values are separated (folders vs. bookmarks).
 * 3. Within the same type, folders use `folderSortBy` and bookmarks use `sortBy` / `thenSortBy`.
 *
 * @param {SortCriteria} criteria - The sort settings to use.
 * @returns {function(BookmarkItem|FolderItem, BookmarkItem|FolderItem): number}
 */
function createCompare(criteria) {
  const {
    sortBy,
    inverse,
    thenSortBy,
    thenInverse,
    folderSortBy,
    folderInverse,
    caseInsensitive,
  } = criteria;

  /** @type {Intl.CollatorOptions} */
  const compareOptions = {
    caseFirst: "upper",
    numeric: true,
    sensitivity: caseInsensitive ? "base" : "case",
  };

  /**
   * Compares two items by a single field, with optional direction reversal.
   * For `"revurl"` and `"hostname"`, the relevant derived property is computed
   * and attached to the items before comparison.
   * @param {BookmarkItem|FolderItem} a
   * @param {BookmarkItem|FolderItem} b
   * @param {string}  field   - The property name to compare.
   * @param {boolean} reverse - If true, flip the comparison result.
   * @returns {number}
   */
  function compareByField(a, b, field, reverse) {
    const sign = reverse ? -1 : 1;
    if (field === "revurl") {
      a.revurl = AsbUtil.reverseBaseUrl(a.url);
      b.revurl = AsbUtil.reverseBaseUrl(b.url);
    } else if (field === "hostname") {
      a.hostname = new URL(a.url).hostname;
      b.hostname = new URL(b.url).hostname;
    }
    if (["title", "url", "revurl", "hostname"].includes(field)) {
      return a[field].localeCompare(b[field], undefined, compareOptions) * sign;
    }
    return (a[field] - b[field]) * sign;
  }

  /**
   * Compares two bookmark items using the primary and optional secondary criteria.
   * @param {BookmarkItem} a
   * @param {BookmarkItem} b
   * @returns {number}
   */
  function compareBookmarks(a, b) {
    const primary = compareByField(a, b, sortBy, inverse);
    if (primary !== 0 || !thenSortBy || thenSortBy === "none") {
      return primary;
    }
    return compareByField(a, b, thenSortBy, thenInverse);
  }

  /**
   * Compares two folder items using the folder sort criterion.
   * Returns 0 (stable) when `folderSortBy` is `"none"`, preserving existing folder order.
   * @param {FolderItem} a
   * @param {FolderItem} b
   * @returns {number}
   */
  function compareFolders(a, b) {
    if (!folderSortBy || folderSortBy === "none") {
      return 0;
    }
    return compareByField(a, b, folderSortBy, folderInverse);
  }

  /**
   * The comparator returned to callers. Applies corruption check, order-based
   * type separation, and type-specific field comparison.
   * @param {BookmarkItem|FolderItem} a
   * @param {BookmarkItem|FolderItem} b
   * @returns {number}
   */
  return function compare(a, b) {
    // Corrupted bookmarks sink to the bottom.
    if (a.corrupted && b.corrupted) return 0;
    if (a.corrupted) return 1;
    if (b.corrupted) return -1;

    // Separate folders from bookmarks based on their sort-group order value.
    if (a.order !== b.order) {
      return a.order - b.order;
    }

    // Same type: use the appropriate comparator.
    if (a.type === "folder") {
      return compareFolders(a, b);
    }
    return compareBookmarks(a, b);
  };
}

// eslint-disable-next-line no-undef
if (typeof module !== "undefined") module.exports = { createCompare };
