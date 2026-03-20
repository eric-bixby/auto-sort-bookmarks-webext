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

class ChangeHandler {
  constructor(sorter) {
    this.sorter = sorter;

    // Bind handlers so 'this' is preserved when used as event listener callbacks.
    this.handleChanged = this.handleChanged.bind(this);
    this.handleCreated = this.handleCreated.bind(this);
    this.handleMoved = this.handleMoved.bind(this);
    this.handleRemoved = this.handleRemoved.bind(this);
    this.handleVisited = this.handleVisited.bind(this);

    this.createChangeListeners();
  }

  handleChanged(id, changeInfo) {
    AsbUtil.log(`onChanged: ${id}`);
    AsbUtil.log(changeInfo);
    this.sorter.sortIfAuto();
  }

  handleCreated(id, bookmark) {
    AsbUtil.log(`onCreated: ${id}`);
    AsbUtil.log(bookmark);
    this.sorter.sortIfAuto();
  }

  handleMoved(id, moveInfo) {
    AsbUtil.log(`onMoved: ${id}`);
    AsbUtil.log(moveInfo);
    this.sorter.sortIfAuto();
  }

  handleRemoved(id, removeInfo) {
    AsbUtil.log(`onRemoved: ${id}`);
    AsbUtil.log(removeInfo);
    if (NodeUtil.getNodeType(removeInfo.node) === "separator") {
      this.sorter.sortIfAuto();
    } else if (NodeUtil.getNodeType(removeInfo.node) === "folder") {
      AsbPrefs.removeFolder(id);
    }
  }

  handleVisited(historyItem) {
    AsbUtil.log("onVisited");
    AsbUtil.log(historyItem);
    if (!historyItem.url.startsWith("moz-extension:")) {
      this.sorter.sortIfAuto();
    }
  }

  createChangeListeners() {
    BrowserUtil.addBookmarkChangedListener(this.handleChanged);
    BrowserUtil.addBookmarkCreatedListener(this.handleCreated);
    BrowserUtil.addBookmarkMovedListener(this.handleMoved);
    BrowserUtil.addBookmarkRemovedListener(this.handleRemoved);
    BrowserUtil.addHistoryVistedListener(this.handleVisited);
    AsbUtil.log("added listeners");
  }

  removeChangeListeners() {
    BrowserUtil.removeBookmarkChangedListener(this.handleChanged);
    BrowserUtil.removeBookmarkCreatedListener(this.handleCreated);
    BrowserUtil.removeBookmarkMovedListener(this.handleMoved);
    BrowserUtil.removeBookmarkRemovedListener(this.handleRemoved);
    BrowserUtil.removeHistoryVistedListener(this.handleVisited);
    AsbUtil.log("removed listeners");
  }
}
