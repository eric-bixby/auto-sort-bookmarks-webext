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

import Bookmark from "./Bookmark";
import Folder from "./Folder";
import Separator from "./Separator";

/**
 * Class for creating a Bookmark, Folder, or Separator from a BookmarkTreeNode.
 */
export default class NodeUtil {
  /**
   * Get the type of node.
   *
   * @param {bookmarks.BookmarkTreeNode} node Node to check.
   * @returns Type of node.
   */
  static getNodeType(node) {
    let type = "bookmark";

    if (typeof node.url === "undefined") {
      type = "folder";
    } else if (node.url === "data:") {
      type = "separator";
    }

    return type;
  }

  /**
   * Create an item from the `type`.
   *
   * @param {string} type The item type.
   * @param {string} id The item ID.
   * @param {int} index The item index.
   * @param {string} parentId The parent ID.
   * @param {string} title The item title.
   * @param {string} url The item URL.
   * @param {int} lastVisited The timestamp of the last visit.
   * @param {int} accessCount The access count.
   * @param {int} dateAdded The timestamp of the date added.
   * @param {int} lastModified The timestamp of the last modified date.
   * @return {*} The new item.
   */
  static createItem(
    type,
    id,
    index,
    parentId,
    title,
    url,
    lastVisited,
    accessCount,
    dateAdded,
    lastModified
  ) {
    let item;

    if (type === "bookmark") {
      item = new Bookmark(
        id,
        index,
        parentId,
        title,
        dateAdded,
        lastModified,
        url,
        lastVisited,
        accessCount
      );
    } else if (type === "folder") {
      item = new Folder(id, index, parentId, title, dateAdded, lastModified);
    } else if (type === "separator") {
      item = new Separator(id, index, parentId);
    }

    return item;
  }

  /**
   * Create an item from the `node` type.
   *
   * @param {bookmarks.BookmarkTreeNode} node The node item.
   * @return {Item} The new item.
   */
  static createItemFromNode(node) {
    return NodeUtil.createItem(
      NodeUtil.getNodeType(node),
      node.id,
      node.index,
      node.parentId,
      node.title,
      node.url,
      node.lastVisited,
      node.accessCount,
      node.dateAdded,
      node.dateGroupModified
    );
  }
}
