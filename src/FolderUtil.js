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
 * A lightweight folder descriptor used by the configure-folders UI.
 * This is a plain object, not a {@link FolderItem}.
 * @typedef {Object} FolderDescriptor
 * @property {string}  id                 - Bookmark folder ID.
 * @property {string}  parentId           - ID of the containing folder.
 * @property {string}  title              - Folder title.
 * @property {boolean} excluded           - True if the do-not-sort flag is set.
 * @property {boolean} recursivelyExcluded - True if the recursive-exclusion flag is set.
 */

/**
 * Folder-related async helpers used by the sorter and the configure-folders UI.
 * @namespace FolderUtil
 */
const FolderUtil = (function () {
  /**
   * Returns {@link FolderDescriptor} objects for the direct folder children of `parentId`.
   * Used by {@link AsbPrefs} to serve the configure-folders UI.
   * @param {string} parentId - The bookmark folder ID whose children to query.
   * @returns {Promise<FolderDescriptor[]>}
   */
  async function getChildrenFolders(parentId) {
    const nodes = await browser.bookmarks.getChildren(parentId);
    if (!nodes) {
      return [];
    }
    return nodes
      .filter((node) => NodeUtil.getNodeType(node) === "folder")
      .map((node) => ({
        id: node.id,
        parentId: node.parentId,
        title: node.title,
        excluded: Annotations.hasDoNotSortAnnotation(node.id),
        recursivelyExcluded: Annotations.hasRecursiveAnnotation(node.id),
      }));
  }

  /**
   * Returns {@link FolderItem} objects for `folderId` itself and all of its
   * non-recursively-excluded descendant folders, in depth-first order.
   * @param {string} folderId - The root folder ID to start from.
   * @returns {Promise<FolderItem[]>}
   */
  async function getDescendantFolders(folderId) {
    const subtree = await browser.bookmarks.getSubTree(folderId);
    const results = [];

    /**
     * Recursively collects sortable folder items from a subtree node.
     * @param {browser.bookmarks.BookmarkTreeNode} node
     */
    function collect(node) {
      if (Annotations.isRecursivelyExcluded(node.id)) {
        return;
      }
      results.push(NodeUtil.createItemFromNode(node));
      if (node.children) {
        node.children
          .filter((child) => NodeUtil.getNodeType(child) === "folder")
          .forEach(collect);
      }
    }

    if (subtree && subtree[0]) {
      collect(subtree[0]);
    }
    return results;
  }

  /**
   * Returns true if the folder is eligible for sorting.
   * A folder is ineligible if it has the do-not-sort annotation, is recursively
   * excluded, or is the bookmark tree root.
   * @param {FolderItem} folder
   * @returns {boolean}
   */
  function canBeSorted(folder) {
    return (
      !Annotations.hasDoNotSortAnnotation(folder.id) &&
      !Annotations.isRecursivelyExcluded(folder.id) &&
      folder.id !== AsbPrefs.getRootId()
    );
  }

  /**
   * Fetches the direct children of a folder, enriches bookmark nodes with
   * history visit data, and returns them split into groups by separators.
   *
   * Each group is an array of {@link BookmarkItem} or {@link FolderItem} objects.
   * A folder with no separators returns a single group; each separator starts
   * a new group, and the separator itself is not included in any group.
   *
   * @param {string} folderId - The folder whose children to fetch.
   * @returns {Promise<Array<Array<BookmarkItem|FolderItem>>>}
   */
  async function getChildrenWithHistory(folderId) {
    const nodes = await browser.bookmarks.getChildren(folderId);
    if (!nodes) {
      return [[]];
    }

    // Fetch visit history for each bookmark node in parallel.
    const historyResults = await Promise.all(
      nodes.map((node) =>
        NodeUtil.getNodeType(node) === "bookmark"
          ? browser.history.getVisits({ url: node.url })
          : Promise.resolve(null)
      )
    );

    nodes.forEach((node, i) => {
      if (historyResults[i] && historyResults[i].length > 0) {
        node.accessCount = historyResults[i].length;
        node.lastVisited = historyResults[i][0].visitTime;
      }
    });

    // Split items into groups divided by separators.
    const groups = [[]];
    for (const node of nodes) {
      const item = NodeUtil.createItemFromNode(node);
      if (item.type === "separator") {
        groups.push([]);
      } else {
        groups[groups.length - 1].push(item);
      }
    }
    return groups;
  }

  /**
   * Moves each item whose current `index` differs from its `oldIndex`.
   * All moves are issued in parallel. Does nothing if no items changed position.
   * @param {Array<Array<BookmarkItem|FolderItem>>} groups - The sorted child groups.
   * @returns {Promise<void>}
   */
  async function saveOrder(groups) {
    const hasMove = groups.some((group) =>
      group.some((item) => item.index !== item.oldIndex)
    );
    if (!hasMove) {
      return;
    }
    await Promise.all(
      groups.flatMap((group) =>
        group.map((item) => browser.bookmarks.move(item.id, { index: item.index }))
      )
    );
  }

  return {
    getChildrenFolders,
    getDescendantFolders,
    canBeSorted,
    getChildrenWithHistory,
    saveOrder,
  };
})();

// eslint-disable-next-line no-undef
if (typeof module !== "undefined") module.exports = FolderUtil;
