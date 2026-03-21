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

const NodeUtil = (function () {
  function getNodeType(node) {
    if (typeof node.url === "undefined") {
      return "folder";
    }
    if (node.url === "data:") {
      return "separator";
    }
    return "bookmark";
  }

  // Creates a plain item object from a browser bookmark node.
  // History fields (lastVisited, accessCount) are optionally pre-enriched by the caller.
  function createItemFromNode(node) {
    const type = getNodeType(node);
    const base = {
      type,
      id: node.id,
      index: node.index,
      oldIndex: node.index,
      parentId: node.parentId,
    };

    if (type === "bookmark") {
      const corrupted =
        node.title === null ||
        node.dateAdded === null ||
        node.lastModified === null ||
        node.url === null;
      if (corrupted) {
        AsbUtil.log(
          `ERROR: Corrupted bookmark found. ID: ${node.id} - Title: ${node.title} - URL: ${node.url}`
        );
      }
      return {
        ...base,
        corrupted,
        title: node.title || "",
        url: node.url || "",
        dateAdded: node.dateAdded || 0,
        lastModified: node.lastModified || 0,
        lastVisited: node.lastVisited || 0,
        accessCount: node.accessCount || 0,
        order: AsbPrefs.getBookmarkOrder(),
      };
    }

    if (type === "folder") {
      return {
        ...base,
        title: node.title || "",
        dateAdded: node.dateAdded || 0,
        lastModified: node.dateGroupModified || 0,
        order: AsbPrefs.getFolderOrder(),
      };
    }

    return base; // separator
  }

  return { getNodeType, createItemFromNode };
})();
