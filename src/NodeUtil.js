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
 * @typedef {"bookmark"|"folder"|"separator"} NodeType
 * The type of a bookmark tree node.
 */

/**
 * Base fields shared by all item types.
 * @typedef {Object} BaseItem
 * @property {NodeType} type      - The item type.
 * @property {string}   id        - Bookmark node ID.
 * @property {number}   index     - Current position within its parent (updated during sort).
 * @property {number}   oldIndex  - Original position at the time the item was created; used to
 *                                  detect whether a move is needed when saving.
 * @property {string}   parentId  - ID of the containing folder.
 */

/**
 * A bookmark item.
 * @typedef {BaseItem} BookmarkItem
 * @property {boolean} corrupted    - True if any required browser field was null.
 * @property {string}  title        - Bookmark title.
 * @property {string}  url          - Bookmark URL.
 * @property {number}  dateAdded    - Unix timestamp (ms) when the bookmark was created.
 * @property {number}  lastModified - Unix timestamp (ms) of the last modification.
 * @property {number}  lastVisited  - Unix timestamp (ms) of the most recent visit (0 if never).
 * @property {number}  accessCount  - Number of history visits.
 * @property {number}  order        - Sort-group key: 1 if folders-first, 2 if bookmarks-first.
 */

/**
 * A folder item.
 * @typedef {BaseItem} FolderItem
 * @property {string} title        - Folder title.
 * @property {number} dateAdded    - Unix timestamp (ms) when the folder was created.
 * @property {number} lastModified - Unix timestamp (ms) of the last modification.
 * @property {number} order        - Sort-group key: 1 if folders-first, 2 if bookmarks-first.
 */

/**
 * A separator item. Contains only the base fields; used as a group divider.
 * @typedef {BaseItem} SeparatorItem
 */

/**
 * Factory functions for creating plain item objects from browser bookmark nodes.
 * @namespace NodeUtil
 */
const NodeUtil = (function () {
  /**
   * Determines the type of a bookmark tree node.
   * - Nodes without a `url` property are folders.
   * - Nodes whose `url` is `"data:"` are separators (Firefox's internal representation).
   * - All other nodes are bookmarks.
   * @param {browser.bookmarks.BookmarkTreeNode} node - The raw browser node.
   * @returns {NodeType}
   */
  function getNodeType(node) {
    if (typeof node.url === "undefined") {
      return "folder";
    }
    if (node.url === "data:") {
      return "separator";
    }
    return "bookmark";
  }

  /**
   * Creates a typed plain item object from a raw browser bookmark node.
   *
   * For bookmarks, the caller is expected to pre-enrich `node.lastVisited` and
   * `node.accessCount` from the history API before calling this function;
   * both default to `0` if absent.
   *
   * @param {browser.bookmarks.BookmarkTreeNode} node - The raw browser node.
   * @returns {BookmarkItem|FolderItem|SeparatorItem}
   */
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

// eslint-disable-next-line no-undef
if (typeof module !== "undefined") module.exports = NodeUtil;
