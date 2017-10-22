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

/* global weh, chrome */

/**
 * Various settings.
 */
let asb = {
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
    if (asb.log) {
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
}

/**
 * Remove the bookmark observer.
 */
function removeBookmarkObserver() {
    // bookmarkManager.removeListener("changed", onChanged);
}

/**
 * Sort all bookmarks.
 */
function sortAllBookmarks() {
    // bookmarkSorter.setChanged();
}

/**
 * Sort if the auto sort option is on.
 */
function sortIfAuto() {
    if (asb.auto_sort) {
        sortAllBookmarks();
    }
}

/**
 * Adjust the auto sorting feature.
 */
function adjustAutoSort() {
    removeBookmarkObserver();

    if (asb.auto_sort) {
        sortAllBookmarks();
        addBookmarkObserver();
    }
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
}

/**
 * Register user events.
 */
function registerUserEvents() {
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
 * Install or upgrade prefs.
 */
function installOrUpgradePrefs() {
    let local_version = asb.version.local();

    // check if this is a first install
    if (local_version !== asb.version.current()) {
        if (local_version === undefined) {
            // first install
            log("First install");
            for (var param in weh.prefs.getAll()) {
                weh.prefs.values[param] = weh.prefs.specs[param].defaultValue;
            }

            //localStorage["prefs"] = 1;
        } else {
            log("Upgrade");
        }

        // update the localStorage version for next time
        asb.version.local("set");
    }
}

/**
 * main
 */
installOrUpgradePrefs();
registerUserEvents();
adjustSortCriteria();
adjustAutoSort();
