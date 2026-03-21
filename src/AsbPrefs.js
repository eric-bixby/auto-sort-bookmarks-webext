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
 * Singleton that manages extension preferences and all UI↔background messaging.
 *
 * **Storage layout** (`browser.storage.local`):
 * - `prefs`     – `{Object}` containing all preference values.
 * - `donotsort` – `{Object}` map of `folderId → true` for excluded folders.
 * - `recursive` – `{Object}` map of `folderId → true` for recursively excluded folders.
 *
 * **Messaging contract** (`browser.runtime.sendMessage`):
 * | `action`                 | Direction | Description |
 * |--------------------------|-----------|-------------|
 * | `getPrefs`               | UI → bg   | Returns all current preference values. |
 * | `setPrefs`               | UI → bg   | Saves `{ prefs: {...} }` to storage. |
 * | `resetPrefs`             | UI → bg   | Resets to defaults, returns new values. |
 * | `queryRoot`              | UI → bg   | Returns root folder children + icon URLs + i18n texts. |
 * | `queryChildren`          | UI → bg   | Returns folder children for `{ parentId }`. |
 * | `sort`                   | UI → bg   | Triggers an immediate sort. |
 * | `openSettings`           | UI → bg   | Focuses or opens the settings tab. |
 * | `sortCheckboxChange`     | UI → bg   | Updates the do-not-sort annotation for `{ folderId, activated }`. |
 * | `recursiveCheckboxChange`| UI → bg   | Updates the recursive annotation for `{ folderId, activated }`. |
 * | `removeFolder`           | bg → UI   | Pushed to open settings tabs when a folder is deleted. |
 *
 * @namespace AsbPrefs
 */
const AsbPrefs = (function () {
  const DEFAULTS = {
    auto_sort: false,
    delay: 3,
    case_insensitive: false,
    sort_by: "title",
    inverse: false,
    then_sort_by: "none",
    then_inverse: false,
    folder_sort_by: "title",
    folder_inverse: false,
    sort_folders_first: true,
  };

  let prefs = Object.assign({}, DEFAULTS);
  let sorterRef = null;
  const listeners = {};

  /**
   * Returns the current value of a preference, falling back to its default.
   * @param {string} name - Preference key.
   * @returns {*}
   */
  function getPref(name) {
    const val = prefs[name];
    return val !== undefined ? val : DEFAULTS[name];
  }

  /**
   * Updates a single preference in memory, persists the full prefs object to
   * storage, and notifies any registered listeners.
   * @param {string} name  - Preference key.
   * @param {*}      value - New value.
   */
  function setPref(name, value) {
    prefs[name] = value;
    browser.storage.local.set({ prefs });
    if (listeners[name]) {
      listeners[name].forEach((cb) => cb(value));
    }
  }

  /**
   * Returns a snapshot of all current preference values, one key per default.
   * @returns {Object}
   */
  function getAllPrefs() {
    const result = {};
    Object.keys(DEFAULTS).forEach((key) => {
      result[key] = getPref(key);
    });
    return result;
  }

  /**
   * Returns the sort-order value assigned to folder items.
   * Folders get order 1 when `sort_folders_first` is true (sorts before bookmarks),
   * or order 2 when false (sorts after bookmarks).
   * @returns {number}
   */
  function getFolderOrder() {
    return getPref("sort_folders_first") ? 1 : 2;
  }

  /**
   * Returns the sort-order value assigned to bookmark items.
   * Bookmarks get order 2 when `sort_folders_first` is true (sorts after folders),
   * or order 1 when false (sorts before folders).
   * @returns {number}
   */
  function getBookmarkOrder() {
    return getPref("sort_folders_first") ? 2 : 1;
  }

  /**
   * Returns the Firefox bookmark tree root ID.
   * @returns {string}
   */
  function getRootId() {
    return "root________";
  }

  /**
   * Registers the sorter instance so that `adjustSortCriteria` and preference
   * listeners can call back into it. Called once during startup.
   * @param {Sorter} sorter
   */
  function setSorter(sorter) {
    sorterRef = sorter;
  }

  /**
   * Reads the current sort-related preferences and pushes them to the sorter
   * as a {@link SortCriteria} object. Called on startup and whenever a
   * sort-related preference changes.
   */
  function adjustSortCriteria() {
    if (!sorterRef) {
      return;
    }
    sorterRef.setCriteria({
      sortBy: getPref("sort_by"),
      inverse: getPref("inverse"),
      thenSortBy: getPref("then_sort_by"),
      thenInverse: getPref("then_inverse"),
      folderSortBy: getPref("folder_sort_by"),
      folderInverse: getPref("folder_inverse"),
      caseInsensitive: getPref("case_insensitive"),
    });
  }

  /**
   * Registers internal listeners so that changes to stored preferences
   * automatically update the sorter's criteria and trigger a re-sort where
   * appropriate. Should be called once after the sorter is created.
   */
  function registerPrefListeners() {
    // These prefs change sort criteria
    const criteriaPrefs = [
      "sort_folders_first",
      "case_insensitive",
      "sort_by",
      "then_sort_by",
      "folder_sort_by",
      "inverse",
      "then_inverse",
      "folder_inverse",
    ];
    criteriaPrefs.forEach((name) => {
      if (!listeners[name]) {
        listeners[name] = [];
      }
      listeners[name].push(() => adjustSortCriteria());
    });

    // These prefs also trigger a sort
    ["auto_sort", "sort_folders_first"].forEach((name) => {
      if (!listeners[name]) {
        listeners[name] = [];
      }
      listeners[name].push(() => {
        if (sorterRef) {
          sorterRef.sortIfAuto();
        }
      });
    });
  }

  /**
   * Notifies all open settings tabs that a folder has been deleted so they can
   * remove its entry from the configure-folders UI.
   * @param {string} id - ID of the deleted folder.
   */
  function removeFolder(id) {
    browser.tabs
      .query({ url: browser.runtime.getURL("settings.html") })
      .then((tabs) => {
        tabs.forEach((tab) => {
          browser.tabs.sendMessage(tab.id, { action: "removeFolder", id });
        });
      });
  }

  /**
   * Loads all persisted data from `browser.storage.local`, initialises
   * {@link Annotations}, and merges saved preferences with the defaults.
   * The provided callback is invoked once loading is complete.
   * @param {function(): void} callback - Called after preferences and annotations are ready.
   */
  function load(callback) {
    browser.storage.local.get(null).then((items) => {
      // Pass entire storage to Annotations so it can find donotsort/recursive keys
      Annotations.init(items);

      // Load saved prefs, falling back to defaults for any missing keys
      if (items.prefs) {
        prefs = Object.assign({}, DEFAULTS, items.prefs);
      }

      if (typeof callback === "function") {
        callback();
      }
    });
  }

  // Handle messages from UI pages (popup, settings).
  browser.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    // Async cases: must return true to keep the message channel open.
    if (message.action === "queryRoot") {
      const texts = {
        recursiveText: browser.i18n.getMessage("recursive"),
        messageText: browser.i18n.getMessage("subfolders_recursively_excluded"),
        loadingText: browser.i18n.getMessage("loading"),
      };
      FolderUtil.getChildrenFolders(getRootId()).then((folders) => {
        sendResponse({
          folders,
          addImgUrl: browser.runtime.getURL("images/add.png"),
          removeImgUrl: browser.runtime.getURL("images/remove.png"),
          texts,
        });
      });
      return true;
    }

    if (message.action === "queryChildren") {
      FolderUtil.getChildrenFolders(message.parentId).then((children) => {
        sendResponse({ children });
      });
      return true;
    }

    // Synchronous cases
    if (message.action === "getPrefs") {
      sendResponse(getAllPrefs());
    } else if (message.action === "setPrefs") {
      Object.keys(message.prefs).forEach((key) => setPref(key, message.prefs[key]));
      sendResponse({ success: true });
    } else if (message.action === "resetPrefs") {
      prefs = Object.assign({}, DEFAULTS);
      browser.storage.local.set({ prefs });
      Object.keys(DEFAULTS).forEach((key) => {
        if (listeners[key]) {
          listeners[key].forEach((cb) => cb(DEFAULTS[key]));
        }
      });
      sendResponse(getAllPrefs());
    } else if (message.action === "sort") {
      if (sorterRef) {
        sorterRef.sortNow();
      }
      sendResponse({ success: true });
    } else if (message.action === "openSettings") {
      browser.tabs
        .query({ url: browser.runtime.getURL("settings.html") })
        .then((tabs) => {
          if (tabs.length > 0) {
            browser.tabs.update(tabs[0].id, { active: true });
            browser.windows.update(tabs[0].windowId, { focused: true });
          } else {
            browser.tabs.create({ url: browser.runtime.getURL("settings.html") });
          }
        });
      sendResponse({ success: true });
    } else if (message.action === "sortCheckboxChange") {
      if (message.activated) {
        Annotations.removeDoNotSortAnnotation(message.folderId);
        Annotations.removeRecursiveAnnotation(message.folderId);
      } else {
        Annotations.setDoNotSortAnnotation(message.folderId);
      }
      sendResponse({ success: true });
    } else if (message.action === "recursiveCheckboxChange") {
      if (message.activated) {
        Annotations.setRecursiveAnnotation(message.folderId);
      } else {
        Annotations.removeRecursiveAnnotation(message.folderId);
      }
      sendResponse({ success: true });
    }
  });

  return {
    getPref,
    getFolderOrder,
    getBookmarkOrder,
    setPref,
    getAllPrefs,
    getRootId,
    setSorter,
    adjustSortCriteria,
    registerPrefListeners,
    removeFolder,
    load,
  };
})();
