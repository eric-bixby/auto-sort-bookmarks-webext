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

const weh = require("weh-background");
const wehPrefs = require("weh-prefs");
const defaults = require("./default-prefs").default;

// TODO: make this a singleton

export default class AsbPrefs {
  constructor() {
    weh.prefs.declare(defaults);

    let storedSettings = {};

    this.getStoredSettings((settings) => {
      storedSettings = settings;

      // Get weh prefs
      const prefs = storedSettings["weh-prefs"] || {};
      wehPrefs.assign(prefs);

      // Listen for change to weh prefs
      weh.rpc.listen({
        prefsSet: function prefsSet(prefs2) {
          storedSettings["weh-prefs"] = prefs2;
          browser.storage.local.set(storedSettings);
          return wehPrefs.assign(prefs2);
        },
      });

      this.adjustSortCriteria();
      this.registerUserEvents();
      this.registerPrefListeners();
    });
  }

  /**
   * Determine if browser is Firefox or not.
   *
   * @returns {boolean}
   */
  isFirefox() {
    return this.weh.browserType === "firefox";
  }

  /**
   * Get stored settings.
   *
   * @param {any} callback Function called to receive stored settings.
   */
  getStoredSettings(callback) {
    const getting = this.browser.storage.local.get();
    getting.then((storedSettings) => {
      if (typeof callback === "function") {
        callback(storedSettings);
      }
    });
  }

  /**
   * Get current preference value or it's default value if not set.
   *
   * @param {string} param Name of preference.
   * @returns {*} Value or default value of preference.
   */
  getPref(param) {
    const { defaultValue } = weh.prefs.$specs[param];
    let value = this.weh.prefs[param];
    if (typeof value === "undefined") {
      value = defaultValue;
    }
    // log("pref " + param + " = " + value);
    return value;
  }

  /**
   * Adjust the sort criteria of the bookmark sorter.
   */
  adjustSortCriteria() {
    const differentFolderOrder =
      this.getPref("folder_sort_order") !== this.getPref("bookmark_sort_order");

    Sorter.setCriteria(
      this.getPref("sort_by"),
      this.getPref("inverse"),
      this.getPref("then_sort_by"),
      this.getPref("then_inverse"),
      this.getPref("folder_sort_by"),
      this.getPref("folder_inverse"),
      differentFolderOrder,
      this.getPref("case_insensitive")
    );
  }

  /**
   * Register listeners for pref changes.
   */
  registerPrefListeners() {
    this.weh.prefs.on("auto_sort", this.sortIfAuto);

    // FIXME: do both things happen?
    this.weh.prefs.on("folder_sort_order", this.sortIfAuto);
    this.weh.prefs.on("bookmark_sort_order", this.sortIfAuto);
    this.weh.prefs.on("folder_sort_order", this.adjustSortCriteria);
    this.weh.prefs.on("bookmark_sort_order", this.adjustSortCriteria);

    this.weh.prefs.on("case_insensitive", this.adjustSortCriteria);
    this.weh.prefs.on("sort_by", this.adjustSortCriteria);
    this.weh.prefs.on("then_sort_by", this.adjustSortCriteria);
    this.weh.prefs.on("folder_sort_by", this.adjustSortCriteria);
    this.weh.prefs.on("inverse", this.adjustSortCriteria);
    this.weh.prefs.on("then_inverse", this.adjustSortCriteria);
    this.weh.prefs.on("folder_inverse", this.adjustSortCriteria);
  }

  /**
   * Register user events.
   */
  registerUserEvents() {
    this.weh.rpc.listen({
      openSettings: () => {
        this.weh.ui.open("settings", {
          type: "tab",
          url: "settings.html",
        });
        this.weh.ui.close("main");
      },
      openConfigureFolders: () => {
        this.weh.ui.open("configure-folders", {
          type: "tab",
          url: "configure-folders.html",
        });
        this.weh.ui.close("main");
      },
      sort: () => {
        this.sortAllBookmarks();
        this.weh.ui.close("main");
      },
      sortCheckboxChange: (folderID, activated) => {
        if (activated) {
          Annotations.removeDoNotSortAnnotation(folderID);
          Annotations.removeRecursiveAnnotation(folderID);
        } else {
          Annotations.setDoNotSortAnnotation(folderID);
        }
      },
      recursiveCheckboxChange: (folderID, activated) => {
        if (activated) {
          Annotations.setRecursiveAnnotation(folderID);
        } else {
          Annotations.removeRecursiveAnnotation(folderID);
        }
      },
      queryRoot: () => {
        const texts = {
          recursiveText: this.weh._("recursive"),
          messageText: this.weh._("subfolders_recursively_excluded"),
          loadingText: this.weh._("loading"),
        };
        const addImgUrl = chrome.extension.getURL("images/add.png");
        const removeImgUrl = chrome.extension.getURL("images/remove.png");
        this.getChildrenFolders(this.getRootId(), (children) => {
          this.weh.rpc.call(
            "configure-folders",
            "root",
            children,
            addImgUrl,
            removeImgUrl,
            texts
          );
        });
      },
      queryChildren: (parentId) => {
        this.getChildrenFolders(parentId, (children) => {
          this.weh.rpc.call(
            "configure-folders",
            "children",
            parentId,
            children
          );
        });
      },
    });
  }

  /**
   * Send message that folder has been removed.
   *
   * @param {*} id ID of removed folder.
   */
  removeFolder(id) {
    this.weh.rpc.call("configure-folders", "removeFolder", id);
  }

  /**
   * Get the rootId.
   *
   * @returns {string}
   */
  getRootId() {
    if (this.isFirefox()) {
      return "root________";
    }
    return "0";
  }
}
