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

import AsbPrefs from "./AsbPrefs";
import AsbUtil from "./AsbUtil";
import Item from "./Item";

/**
 * Bookmark class.
 */
export default class Bookmark extends Item {
  /**
   * Get a bookmark.
   *
   * @param {string} id The bookmark identifier.
   * @param {int} index The bookmark position.
   * @param {string} parentId The bookmark parent identifier.
   * @param {string} title The bookmark title.
   * @param {int} dateAdded The timestamp of the date added.
   * @param {int} lastModified The timestamp of the last modified date.
   * @param {string} url The item URL.
   * @param {int} lastVisited The timestamp of the last visit.
   * @param {int} accessCount The access count.
   */
  constructor(
    id,
    index,
    parentId,
    title,
    dateAdded,
    lastModified,
    url,
    lastVisited,
    accessCount
  ) {
    super(id, index, parentId);

    if (
      title === null ||
      dateAdded === null ||
      lastModified === null ||
      url === null ||
      lastVisited === null ||
      accessCount === null
    ) {
      AsbUtil.log(
        `ERROR: Corrupted bookmark found. ID: ${id} - Title: ${title} - URL: ${url}`
      );
      this.corrupted = true;
    }

    this.title = title || "";
    this.url = url || "";
    this.lastVisited = lastVisited || 0;
    this.accessCount = accessCount || 0;
    this.dateAdded = dateAdded || 0;
    this.lastModified = lastModified || 0;
    this.order = AsbPrefs.getPref("bookmark_sort_order");
  }
}
