/*
 * Copyright (C) 2014-2017  Boucher, Antoni <bouanto@zoho.com>
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

"use strict";

/* global weh */

/**
 * Various settings.
 */
let prefs = {
    // only set to true while debugging, set to false when released
    "log": true,
    "version": {
        "current": function () {
            return chrome.app.getDetails().version;
        },
        "local": function (set) {
            if (set === undefined) {
                return localStorage["version"];
            } else {
                localStorage["version"] = this.current();
            }
        }
    },
    "auto_sort": true
};

/**
 * If enabled, send message to console for debugging.
 *
 * @param {*} o
 */
function log(o) {
    if (prefs.log) {
        console.log(o);
    }
}

/**
 * On item added/changed/moved/removed/visited callback.
 *
 * @param item
 * @param deleted
 * @param newFolder
 * @param annotationChange
 */
// function onChanged(item, deleted, newFolder, annotationChange) {
//     bookmarkSorter.setChanged();
//     log("onChanged");
// }

/**
 * Add the bookmark observer.
 */
function addBookmarkObserver() {
    // bookmarkManager.on("changed", onChanged);
    log("addBookmarkObserver");
}

/**
 * Remove the bookmark observer.
 */
function removeBookmarkObserver() {
    // bookmarkManager.removeListener("changed", onChanged);
    log("removeBookmarkObserver");
}

/**
 * Sort all bookmarks.
 */
function sortAllBookmarks() {
    // bookmarkSorter.setChanged();
    log("sortAllBookmarks");
}

/**
 * Sort if the auto sort option is on.
 */
function sortIfAuto() {
    if (prefs.auto_sort) {
        sortAllBookmarks();
    }
    log("sortIfAuto");
}

/**
 * Adjust the auto sorting feature.
 */
function adjustAutoSort() {
    removeBookmarkObserver();
    if (prefs.auto_sort) {
        sortAllBookmarks();
        addBookmarkObserver();
    }
    log("adjustAutoSort");
}

/**
 * Adjust the sort criteria of the bookmark sorter.
 */
function adjustSortCriteria() {
    // let differentFolderOrder = prefs.folder_sort_order !== prefs.livemark_sort_order && prefs.folder_sort_order !== prefs.smart_bookmark_sort_order && prefs.folder_sort_order !== prefs.bookmark_sort_order;
    // bookmarkSorter.setCriteria(sortCriterias[prefs.sort_by], prefs.inverse,
    //     sortCriterias[parseInt(prefs.then_sort_by)] || undefined, prefs.then_inverse,
    //     sortCriterias[parseInt(prefs.folder_sort_by)], prefs.folder_inverse,
    //     differentFolderOrder, prefs.case_insensitive
    // );
    sortIfAuto();
    log("adjustSortCriteria");
}

/**
 * Register user events.
 */
function registerUserEvents() {
    log("registerUserEvents");

    /*
    * Popup panel that opens from a toolbar button.
    */
    weh.ui.update("default", {
        type: "popup",
        onMessage: function (message) {
            switch (message.type) {
                case "open-settings":
                    weh.ui.close("default");
                    weh.ui.open("settings");
                    break;
            }
        }
    });

    /*
    * Tab for settings.
    */
    weh.ui.update("settings", {
        type: "tab",
        contentURL: "content/settings.html"
    });
}

/**
 * Migrate prefs from older version to current version.
 */
function migratePrefs() {
    // if (upgrade) {
    //     prefs.migration = self.version;
    // }
    log("migratePrefs");
}

/**
 * main
 */
log("main:bdeing");
migratePrefs();
registerUserEvents();
adjustSortCriteria();
adjustAutoSort();
log("main:end");
