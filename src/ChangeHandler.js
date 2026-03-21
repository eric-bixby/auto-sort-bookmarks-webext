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
 * @typedef {Object} ChangeHandler
 * @property {function(): void} createChangeListeners - Registers all bookmark and history listeners.
 * @property {function(): void} removeChangeListeners - Removes all bookmark and history listeners.
 */

/**
 * Creates a change handler that listens for bookmark and history events and
 * triggers sorting when they occur.
 *
 * Listeners are kept as named function references so they can be removed
 * precisely without affecting other listeners on the same events.
 *
 * Special cases:
 * - Removing a **separator** triggers a re-sort (index gaps need to be closed).
 * - Removing a **folder** notifies any open settings tabs via {@link AsbPrefs.removeFolder}.
 * - History visits from the extension's own pages (`moz-extension:`) are ignored.
 *
 * @param {Sorter} sorter - The sorter to invoke when a relevant change is detected.
 * @returns {ChangeHandler}
 */
function createChangeHandler(sorter) {
  /**
   * @param {string} id - ID of the changed bookmark.
   */
  function handleChanged(id) {
    AsbUtil.log(`onChanged: ${id}`);
    sorter.sortIfAuto();
  }

  /**
   * @param {string} id - ID of the newly created bookmark.
   */
  function handleCreated(id) {
    AsbUtil.log(`onCreated: ${id}`);
    sorter.sortIfAuto();
  }

  /**
   * @param {string} id - ID of the moved bookmark.
   */
  function handleMoved(id) {
    AsbUtil.log(`onMoved: ${id}`);
    sorter.sortIfAuto();
  }

  /**
   * @param {string} id         - ID of the removed node.
   * @param {Object} removeInfo - Browser-provided removal info, including `removeInfo.node`.
   */
  function handleRemoved(id, removeInfo) {
    AsbUtil.log(`onRemoved: ${id}`);
    const type = NodeUtil.getNodeType(removeInfo.node);
    if (type === "separator") {
      sorter.sortIfAuto();
    } else if (type === "folder") {
      AsbPrefs.removeFolder(id);
    }
  }

  /**
   * @param {browser.history.HistoryItem} historyItem - The visited page record.
   */
  function handleVisited(historyItem) {
    AsbUtil.log("onVisited");
    if (!historyItem.url.startsWith("moz-extension:")) {
      sorter.sortIfAuto();
    }
  }

  return {
    /**
     * Attaches all bookmark and history event listeners.
     */
    createChangeListeners() {
      browser.bookmarks.onChanged.addListener(handleChanged);
      browser.bookmarks.onCreated.addListener(handleCreated);
      browser.bookmarks.onMoved.addListener(handleMoved);
      browser.bookmarks.onRemoved.addListener(handleRemoved);
      browser.history.onVisited.addListener(handleVisited);
      AsbUtil.log("added listeners");
    },

    /**
     * Detaches all bookmark and history event listeners.
     * Called before a sort begins to prevent the `browser.bookmarks.move`
     * calls made during sorting from triggering another sort.
     */
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
