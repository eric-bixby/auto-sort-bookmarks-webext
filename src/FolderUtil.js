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

const FolderUtil = (function () {
  // Returns plain folder descriptor objects for the direct children of parentId.
  // Used by AsbPrefs to serve the configure-folders UI.
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

  // Returns folder items for the given folder and all non-recursively-excluded descendants.
  async function getDescendantFolders(folderId) {
    const subtree = await browser.bookmarks.getSubTree(folderId);
    const results = [];

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

  // Returns true if the folder should be sorted.
  function canBeSorted(folder) {
    return (
      !Annotations.hasDoNotSortAnnotation(folder.id) &&
      !Annotations.isRecursivelyExcluded(folder.id) &&
      folder.id !== AsbPrefs.getRootId()
    );
  }

  // Fetches direct children, enriches bookmarks with history data, and
  // returns them as an array of groups split by separators.
  async function getChildrenWithHistory(folderId) {
    const nodes = await browser.bookmarks.getChildren(folderId);
    if (!nodes) {
      return [[]];
    }

    // Fetch history for each bookmark node in parallel.
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

    // Split items into groups separated by separators.
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

  // Moves any items whose index changed from their original position.
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
