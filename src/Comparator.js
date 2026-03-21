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

// Creates a comparator function from the given sort criteria.
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

  const compareOptions = {
    caseFirst: "upper",
    numeric: true,
    sensitivity: caseInsensitive ? "base" : "case",
  };

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

  function compareBookmarks(a, b) {
    const primary = compareByField(a, b, sortBy, inverse);
    if (primary !== 0 || !thenSortBy || thenSortBy === "none") {
      return primary;
    }
    return compareByField(a, b, thenSortBy, thenInverse);
  }

  function compareFolders(a, b) {
    if (!folderSortBy || folderSortBy === "none") {
      return 0;
    }
    return compareByField(a, b, folderSortBy, folderInverse);
  }

  return function compare(a, b) {
    // Corrupted bookmarks sink to the bottom.
    if (a.corrupted && b.corrupted) return 0;
    if (a.corrupted) return 1;
    if (b.corrupted) return -1;

    // Separate folders from bookmarks based on their sort order.
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
