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

import AsbUtil from "./AsbUtil";
import BrowserUtil from "./BrowserUtil";

/**
 * Class for handling bookmark changes.
 */
export default class ChangeHandler {
  /**
   * Creates an instance of ChangeHandler.
   *
   * @memberof ChangeHandler
   */
  constructor(sorter) {
    this.sorter = sorter;
    this.createChangeListeners();
  }

  /**
   * Changed event handler.
   *
   * @param {any} id
   * @param {any} changeInfo
   * @memberof ChangeHandler
   */
  handleChanged(id, changeInfo) {
    AsbUtil.log(`onChanged: ${id}`);
    AsbUtil.log(changeInfo);
    this.sorter.sortIfAuto();
  }

  /**
   * Created event handler.
   *
   * @param {any} id
   * @param {any} bookmark
   * @memberof ChangeHandler
   */
  handleCreated(id, bookmark) {
    AsbUtil.log(`onCreated: ${id}`);
    AsbUtil.log(bookmark);
    this.sorter.sortIfAuto();
  }

  /**
   * Moved event handler.
   *
   * @param {any} id
   * @param {any} moveInfo
   * @memberof ChangeHandler
   */
  handleMoved(id, moveInfo) {
    AsbUtil.log(`onMoved: ${id}`);
    AsbUtil.log(moveInfo);
    this.sorter.sortIfAuto();
  }

  /**
   * Removed event handler.
   *
   * @param {any} id
   * @param {any} removeInfo
   * @memberof ChangeHandler
   */
  handleRemoved(id, removeInfo) {
    AsbUtil.log(`onRemoved: ${id}`);
    AsbUtil.log(removeInfo);
    if (this.sorter.getNodeType(removeInfo.node) === "separator") {
      this.sorter.sortIfAuto();
    } else if (this.sorter.getNodeType(removeInfo.node) === "folder") {
      AsbPrefs.removeFolder(id);
    }
  }

  /**
   * Visited event handler.
   *
   * @param {any} historyItem
   * @memberof ChangeHandler
   */
  handleVisited(historyItem) {
    AsbUtil.log("onVisited");
    AsbUtil.log(historyItem);
    if (!historyItem.url.startsWith("moz-extension:")) {
      this.sorter.sortIfAuto();
    }
  }

  /**
   * Add listeners.
   *
   * @memberof ChangeHandler
   */
  createChangeListeners() {
    BrowserUtil.addBookmarkChangedListener(this.handleChanged);
    BrowserUtil.addBookmarkCreatedListener(this.handleCreated);
    BrowserUtil.addBookmarkMovedListener(this.handleMoved);
    BrowserUtil.addBookmarkRemovedListener(this.handleRemoved);
    BrowserUtil.addHistoryVistedListener(this.handleVisited);
    AsbUtil.log("added listeners");
  }

  /**
   * Remove listeners.
   *
   * @memberof ChangeHandler
   */
  removeChangeListeners() {
    BrowserUtil.removeBookmarkChangedListener(this.handleChanged);
    BrowserUtil.removeBookmarkCreatedListener(this.handleCreated);
    BrowserUtil.removeBookmarkMovedListener(this.handleMoved);
    BrowserUtil.removeBookmarkRemovedListener(this.handleRemoved);
    BrowserUtil.removeHistoryVistedListener(this.handleVisited);
    AsbUtil.log("removed listeners");
  }
}
