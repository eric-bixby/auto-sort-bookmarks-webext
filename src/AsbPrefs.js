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

// Singleton that manages preferences and handles all UI↔background messaging.
// Replaces the weh framework (weh-background, weh-prefs, weh.rpc).
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
    folder_sort_order: 1,
    bookmark_sort_order: 2,
  };

  let prefs = Object.assign({}, DEFAULTS);
  let sorterRef = null;
  const listeners = {};

  function getPref(name) {
    const val = prefs[name];
    return val !== undefined ? val : DEFAULTS[name];
  }

  function setPref(name, value) {
    prefs[name] = value;
    browser.storage.local.set({ prefs });
    if (listeners[name]) {
      listeners[name].forEach((cb) => cb(value));
    }
  }

  function getAllPrefs() {
    const result = {};
    Object.keys(DEFAULTS).forEach((key) => {
      result[key] = getPref(key);
    });
    return result;
  }

  function getRootId() {
    return "root________";
  }

  function setSorter(sorter) {
    sorterRef = sorter;
  }

  function adjustSortCriteria() {
    if (!sorterRef) {
      return;
    }
    sorterRef.setCriteria(
      getPref("sort_by"),
      getPref("inverse"),
      getPref("then_sort_by"),
      getPref("then_inverse"),
      getPref("folder_sort_by"),
      getPref("folder_inverse"),
      getPref("folder_sort_order") !== getPref("bookmark_sort_order"),
      getPref("case_insensitive")
    );
  }

  function registerPrefListeners() {
    // These prefs change sort criteria
    const criteriaPrefs = [
      "folder_sort_order",
      "bookmark_sort_order",
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
    ["auto_sort", "folder_sort_order", "bookmark_sort_order"].forEach((name) => {
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

  function removeFolder(id) {
    browser.tabs
      .query({ url: browser.runtime.getURL("configure-folders.html") })
      .then((tabs) => {
        tabs.forEach((tab) => {
          browser.tabs.sendMessage(tab.id, { action: "removeFolder", id });
        });
      });
  }

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

  // Handle messages from UI pages (popup, settings, configure-folders).
  browser.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    // Async cases: must return true to keep the message channel open.
    if (message.action === "queryRoot") {
      const texts = {
        recursiveText: browser.i18n.getMessage("recursive"),
        messageText: browser.i18n.getMessage("subfolders_recursively_excluded"),
        loadingText: browser.i18n.getMessage("loading"),
      };
      FolderUtil.getChildrenFolders(getRootId(), (children) => {
        sendResponse({
          folders: children,
          addImgUrl: browser.runtime.getURL("images/add.png"),
          removeImgUrl: browser.runtime.getURL("images/remove.png"),
          texts,
        });
      });
      return true;
    }

    if (message.action === "queryChildren") {
      FolderUtil.getChildrenFolders(message.parentId, (children) => {
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
      browser.tabs.create({ url: browser.runtime.getURL("settings.html") });
      sendResponse({ success: true });
    } else if (message.action === "openConfigureFolders") {
      browser.tabs.create({
        url: browser.runtime.getURL("configure-folders.html"),
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
