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

// Creates bookmark and history event listeners that trigger sorting.
// Returns { createChangeListeners, removeChangeListeners }.
function createChangeHandler(sorter) {
  function handleChanged(id) {
    AsbUtil.log(`onChanged: ${id}`);
    sorter.sortIfAuto();
  }

  function handleCreated(id) {
    AsbUtil.log(`onCreated: ${id}`);
    sorter.sortIfAuto();
  }

  function handleMoved(id) {
    AsbUtil.log(`onMoved: ${id}`);
    sorter.sortIfAuto();
  }

  function handleRemoved(id, removeInfo) {
    AsbUtil.log(`onRemoved: ${id}`);
    const type = NodeUtil.getNodeType(removeInfo.node);
    if (type === "separator") {
      sorter.sortIfAuto();
    } else if (type === "folder") {
      AsbPrefs.removeFolder(id);
    }
  }

  function handleVisited(historyItem) {
    AsbUtil.log("onVisited");
    if (!historyItem.url.startsWith("moz-extension:")) {
      sorter.sortIfAuto();
    }
  }

  return {
    createChangeListeners() {
      browser.bookmarks.onChanged.addListener(handleChanged);
      browser.bookmarks.onCreated.addListener(handleCreated);
      browser.bookmarks.onMoved.addListener(handleMoved);
      browser.bookmarks.onRemoved.addListener(handleRemoved);
      browser.history.onVisited.addListener(handleVisited);
      AsbUtil.log("added listeners");
    },

    removeChangeListeners() {
      browser.bookmarks.onChanged.removeListener(handleChanged);
      browser.bookmarks.onCreated.removeListener(handleCreated);
      browser.bookmarks.onMoved.removeListener(handleMoved);
      browser.bookmarks.onRemoved.removeListener(handleRemoved);
      browser.history.onVisited.removeListener(handleVisited);
      AsbUtil.log("removed listeners");
    },
  };
}
