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

/**
 * Item class.
 */
export default class Item {
  /**
   * Creates an instance of Item.
   *
   * @param {string} id
   * @param {number} index
   * @param {string} parentId
   * @memberof Item
   */
  constructor(id, index, parentId) {
    this.id = id;
    this.setIndex(index);
    this.parentId = parentId;
  }

  /**
   * Save the new index.
   *
   * @memberof Item
   */
  saveIndex() {
    return chrome.bookmarks.move(this.id, { index: this.index });
  }

  /**
   * Set the new index and save the old index.
   *
   * @param {int} index The new index.
   * @memberof Item
   */
  setIndex(index) {
    this.oldIndex = this.index || index;
    this.index = index;
  }
}
