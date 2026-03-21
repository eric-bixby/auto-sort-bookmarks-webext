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

class NodeUtil {
  static getNodeType(node) {
    if (typeof node.url === "undefined") {
      return "folder";
    }
    if (node.url === "data:") {
      return "separator";
    }
    return "bookmark";
  }

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
    if (type === "bookmark") {
      return new Bookmark(
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
      return new Folder(id, index, parentId, title, dateAdded, lastModified);
    } else if (type === "separator") {
      return new Separator(id, index, parentId);
    }
  }

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
