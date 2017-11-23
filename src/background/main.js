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

/* exported showConfigureFoldersToExclude */

// =======
// CLASSES
// =======

// TODO: add a mapping function so works for both browsers
// mapping chrome to FF bookmark id (chrome-id, ff-id, ff-title):
// "0"   = "root________" = "?"
// "1"   = "toolbar_____" = "Bookmarks Toolbar"
// "2"   = "menu________" = "?"
// "3"   = "mobile______" = "Mobile Bookmarks" (not used by FF)
// undef = "unfiled_____" = "Other Bookmarks" (not used by chrome)

/**
 * Various settings.
 */
let asb = {
    "rootID": {
        "root": "root________",
        "bookmarks_bar": "toolbar_____",
        "other_bookmarks": "menu________",
        "mobile_bookmarks": "mobile______"
    },
    "version": {
        "current": function () {
            var manifest = browser.runtime.getManifest();
            return manifest.version;
        },
        "local": function (set) {
            if (set === undefined) {
                return localStorage["version"];
            } else {
                localStorage["version"] = this.current();
            }
        }
    }
};

/**
 * Bookmark manager class.
 * 
 * @class BookmarkManager
 */
class BookmarkManager {
    /**
     * Creates an instance of BookmarkManager.
     * 
     * @memberof BookmarkManager
     */
    constructor() {
        this.createChangeListeners();
    }

    /**
     * Changed event handler.
     * 
     * @param {any} id 
     * @param {any} changeInfo 
     * @memberof BookmarkManager
     */
    handleChanged(id, changeInfo) {
        log("onChanged id = " + id + " " + changeInfo);
        sortIfAuto();
    }

    /**
     * Created event handler.
     * 
     * @param {any} id 
     * @param {any} bookmark 
     * @memberof BookmarkManager
     */
    handleCreated(id, bookmark) {
        log("onCreated id = " + id + " " + bookmark);
        sortIfAuto();
    }

    /**
     * Moved event handler.
     * 
     * @param {any} id 
     * @param {any} moveInfo 
     * @memberof BookmarkManager
     */
    handleMoved(id, moveInfo) {
        log("onMoved id = " + id + " " + moveInfo);
        sortIfAuto();
    }

    /**
     * Removed event handler.
     * 
     * @param {any} id 
     * @param {any} removeInfo 
     * @memberof BookmarkManager
     */
    handleRemoved(id, removeInfo) {
        log("onRemoved id = " + id + " " + removeInfo);
        if (removeInfo.node.type === "separator") {
            sortIfAuto();
        }
    }

    /**
     * Create bookmark change listeners.
     * 
     * @memberof BookmarkManager
     */
    createChangeListeners() {
        browser.bookmarks.onChanged.addListener(this.handleChanged);
        browser.bookmarks.onCreated.addListener(this.handleCreated);
        browser.bookmarks.onMoved.addListener(this.handleMoved);
        browser.bookmarks.onRemoved.addListener(this.handleRemoved);
    }

    /**
     * Remove bookmark change listeners.
     * 
     * @memberof BookmarkManager
     */
    removeChangeListeners() {
        browser.bookmarks.onChanged.removeListener(this.handleChanged);
        browser.bookmarks.onCreated.removeListener(this.handleCreated);
        browser.bookmarks.onMoved.removeListener(this.handleMoved);
        browser.bookmarks.onRemoved.removeListener(this.handleRemoved);
    }
}

/**
 * Item class.
 * 
 * @class Item
 */
class Item {
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
        browser.bookmarks.move(this.id, { index: this.index });
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

/**
 * Bookmark class.
 */
class Bookmark extends Item {
    /**
     * Get a bookmark.
     *
     * @param {string} id The bookmark identifier.
     * @param {int} index The bookmark position.
     * @param {string} parentId The bookmark parent identifier.
     * @param {string} title The bookmark title.
     * @param {int} dateAdded The timestamp of the date added.
     * @param {int} lastModified The timestamp of the last modified date.
     * @param {string} url The item URL.
     * @param {int} lastVisited The timestamp of the last visit.
     * @param {int} accessCount The access count.
     */
    constructor(id, index, parentId, title, dateAdded, lastModified, url, lastVisited, accessCount) {
        super(id, index, parentId);

        if (title === null || dateAdded === null || lastModified === null || url === null || lastVisited === null || accessCount === null) {
            log("Corrupted bookmark found. ID: " + id + " - Title: " + title + " - URL: " + url);
            this.corrupted = true;
        }

        this.title = title || "";
        this.url = url || "";
        this.lastVisited = lastVisited || 0;
        this.accessCount = accessCount || 0;
        this.dateAdded = dateAdded || 0;
        this.lastModified = lastModified || 0;
        this.order = getPref("bookmark_sort_order");
        // TODO: get description; chrome doesn't have but where does FF keep it?
        // this.description = getDescription(this) || "";
        this.description = "";
        this.setKeyword();
    }

    /**
     * Fetch the keyword and set it to the current bookmark.
     */
    setKeyword() {
        let keyword = "";
        // TODO: chrome does not support keyword
        this.keyword = keyword;
    }
}

/**
 * Separator class.
 */
class Separator extends Item {
    /**
     * Get a separator.
     *
     * @param {string} id The separator identifier.
     * @param {int} index The separator position.
     * @param {string} parentId The separator parent identifier.
     */
    constructor(id, index, parentId) {
        super(id, index, parentId);
    }
}

/**
 * Folder class.
 */
class Folder extends Bookmark {
    /**
     * Get a folder.
     *
     * @param {string} id The folder identifier.
     * @param {int} index The folder position.
     * @param {string} parentId The folder parent identifier.
     * @param {string} title The folder title.
     * @param {int} dateAdded The timestamp of the date added.
     * @param {int} lastModified The timestamp of the last modified date.
     */
    constructor(id, index, parentId, title, dateAdded, lastModified) {
        super(id, index, parentId, title, dateAdded, lastModified);

        this.order = getPref("folder_sort_order");
    }

    /**
     * Check if this folder can be sorted.
     *
     * @return {boolean} Whether it can be sorted or not.
     */
    canBeSorted() {
        // if (hasDoNotSortAnnotation(this.id) || this.hasAncestorExcluded()) {
        //     return false;
        // }

        return !this.isRoot();
    }

    /**
     * Get the immediate children.
     * 
     * @param {*} callback The callback function.
     * @param {*} compare The compare function.
     */
    getChildren(callback, compare) {
        this.children = [[]];
        var self = this;

        browser.bookmarks.getChildren(this.id, function (o) {
            if (o !== undefined) {
                let index = 0;

                for (let node of o) {
                    let item = createItemFromNode(node);
                    if (item instanceof Separator) {
                        // create sub-array to store nodes after separator
                        self.children.push([]);
                        ++index;
                    }
                    else if (item !== undefined) {
                        self.children[index].push(item);
                    }
                }

                if (typeof (callback) === "function") {
                    callback(self, compare);
                }
            }
        });
    }

    /**
     * Get folders recursively.
     * 
     * @param {*} callback The callback function.
     */
    getFolders(callback) {
        this.folders = [];
        var self = this;

        browser.bookmarks.getSubTree(this.id, (function () {
            /**
             * Get sub folders. Defined locally so that it can be called recursively and not blow the stack.
             * 
             * @param {*} List of bookmarks.
             * @returns {*} Callback.
             */
            function getSubFolders(o) {
                if (o !== undefined) {
                    let folder;
                    let isTop = false;

                    for (let node of o) {
                        // if (!isRecursivelyExcluded(node.id)) {
                        if (node.url === undefined) {
                            // TODO: get chrome equivilant of node.dateAdded, node.lastModified
                            folder = new Folder(node.id, node.index, node.parentId, node.title, node.dateAdded, node.lastModified);
                            if (self.id === node.id) {
                                isTop = true;
                            }

                            self.folders.push(folder);
                            getSubFolders(node.children);
                        }
                    }

                    // only return the complete list if this is the top interition
                    if (isTop && typeof (callback) === "function") {
                        callback(self.folders);
                    }
                }
            }
            return getSubFolders;
        })());
    }

    /**
     * Check if this folder has an ancestor that is recursively excluded.
     *
     * @returns {boolean} Whether this node has ancestor excluded or not.
     */
    hasAncestorExcluded() {
        // if (isRecursivelyExcluded(this.id)) {
        //     return true;
        // }
        // TODO: do this check recursively

        return false;
    }

    /**
     * Check if this folder is a root folder (menu, toolbar, unsorted).
     *
     * @return {boolean} Whether this is a root folder or not.
     */
    isRoot() {
        return this.parentId === asb.rootID.root;
    }

    /**
     * Check if at least one children has moved.
     *
     * @return {boolean} Whether at least one children has moved or not.
     */
    hasMove() {
        for (let i = 0; i < this.children.length; ++i) {
            let length = this.children[i].length;
            for (let j = 0; j < length; ++j) {
                if (this.children[i][j].index !== this.children[i][j].oldIndex) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Save the new children positions.
     */
    save() {
        if (this.hasMove()) {
            for (let i = 0; i < this.children.length; ++i) {
                let length = this.children[i].length;
                for (let j = 0; j < length; ++j) {
                    this.children[i][j].saveIndex();
                }
            }
        }
    }
}

/**
 * Bookmark sorter class.
 */
class BookmarkSorter {
    /**
     * Get a bookmark sorter.
     */
    constructor() {
        /**
         * Indicates if sorting is in progress.
         */
        this.sorting = false;

        /**
         * Indicates if waiting for activity to stop.
         */
        this.isWaiting = false;

        /**
         * Last time checked for change
         */
        this.lastCheck = Date.now();
    }

    /**
     * Create a bookmark comparator.
     * 
     * @returns {*} The comparator.
     */
    createCompare() {
        let comparator;

        /**
         * Check for corrupted and order flags.
         * 
         * @param bookmark1
         * @param bookmark2
         * @returns {number}
         */
        function checkCorruptedAndOrder(bookmark1, bookmark2) {
            if (bookmark1.corrupted) {
                if (bookmark2.corrupted) {
                    return 0;
                }

                return 1;
            }
            else if (bookmark2.corrupted) {
                return -1;
            }

            if (bookmark1.order !== bookmark2.order) {
                return bookmark1.order - bookmark2.order;
            }
        }

        /**
         * Add reverse URLs.
         * 
         * @param bookmark1
         * @param bookmark2
         * @param criteria
         */
        function addReverseUrls(bookmark1, bookmark2, criteria) {
            if (criteria === "revurl") {
                bookmark1.revurl = reverseBaseUrl(bookmark1.url);
                bookmark2.revurl = reverseBaseUrl(bookmark2.url);
            }
        }

        let compareOptions = {
            caseFirst: "upper",
            numeric: true,
            sensitivity: "case",
        };

        if (BookmarkSorter.prototype.caseInsensitive) {
            compareOptions.sensitivity = "base";
        }

        let firstComparator;
        if (["title", "url", "revurl", "description", "keyword"].indexOf(BookmarkSorter.prototype.firstSortCriteria) !== -1) {
            firstComparator = function (bookmark1, bookmark2) {
                addReverseUrls(bookmark1, bookmark2, BookmarkSorter.prototype.firstSortCriteria);
                return bookmark1[BookmarkSorter.prototype.firstSortCriteria].localeCompare(bookmark2[BookmarkSorter.prototype.firstSortCriteria], undefined, compareOptions) * BookmarkSorter.prototype.firstReverse;
            };
        }
        else {
            firstComparator = function (bookmark1, bookmark2) {
                return (bookmark1[BookmarkSorter.prototype.firstSortCriteria] - bookmark2[BookmarkSorter.prototype.firstSortCriteria]) * BookmarkSorter.prototype.firstReverse;
            };
        }

        let secondComparator;
        if (BookmarkSorter.prototype.secondSortCriteria !== undefined) {
            if (["title", "url", "revurl", "description", "keyword"].indexOf(BookmarkSorter.prototype.secondSortCriteria) !== -1) {
                secondComparator = function (bookmark1, bookmark2) {
                    addReverseUrls(bookmark1, bookmark2, BookmarkSorter.prototype.secondSortCriteria);
                    return bookmark1[BookmarkSorter.prototype.secondSortCriteria].localeCompare(bookmark2[BookmarkSorter.prototype.secondSortCriteria], undefined, compareOptions) * BookmarkSorter.prototype.secondReverse;
                };
            }
            else {
                secondComparator = function (bookmark1, bookmark2) {
                    return (bookmark1[BookmarkSorter.prototype.secondSortCriteria] - bookmark2[BookmarkSorter.prototype.secondSortCriteria]) * BookmarkSorter.prototype.secondReverse;
                };
            }
        }
        else {
            secondComparator = function () {
                return 0;
            };
        }

        let itemComparator = function (bookmark1, bookmark2) {
            return firstComparator(bookmark1, bookmark2) || secondComparator(bookmark1, bookmark2);
        };

        if (BookmarkSorter.prototype.differentFolderOrder) {
            if (BookmarkSorter.prototype.folderSortCriteria !== undefined) {
                comparator = function (bookmark1, bookmark2) {
                    if (bookmark1 instanceof Folder && bookmark2 instanceof Folder) {
                        if (["title", "description"].indexOf(BookmarkSorter.prototype.folderSortCriteria) !== -1) {
                            return bookmark1[BookmarkSorter.prototype.folderSortCriteria].localeCompare(bookmark2[BookmarkSorter.prototype.folderSortCriteria], undefined, compareOptions) * BookmarkSorter.prototype.folderReverse;
                        }

                        return (bookmark1[BookmarkSorter.prototype.folderSortCriteria] - bookmark2[BookmarkSorter.prototype.folderSortCriteria]) * BookmarkSorter.prototype.folderReverse;
                    }

                    return itemComparator(bookmark1, bookmark2);
                };
            }
            else {
                comparator = function (bookmark1, bookmark2) {
                    if (bookmark1 instanceof Folder && bookmark2 instanceof Folder) {
                        return 0;
                    }

                    return itemComparator(bookmark1, bookmark2);
                };
            }
        }
        else {
            comparator = itemComparator;
        }

        return function (bookmark1, bookmark2) {
            let result = checkCorruptedAndOrder(bookmark1, bookmark2);
            if (result === undefined) {
                return comparator(bookmark1, bookmark2);
            }

            return result;
        };
    }

    /**
     * Sort all bookmarks.
     */
    sortAllBookmarks() {
        let p1 = new Promise((resolve) => {
            let folders = [];

            // if (!isRecursivelyExcluded(menuFolder.id)) {
            folders.push(menuFolder);

            menuFolder.getFolders(function (subfolders) {
                for (let f of subfolders) {
                    folders.push(f);
                }
                resolve(folders);
            });
            // } else {
            //     resolve(folders);
            // }
        });

        let p2 = new Promise((resolve) => {
            let folders = [];

            // if (!isRecursivelyExcluded(toolbarFolder.id)) {
            folders.push(toolbarFolder);

            toolbarFolder.getFolders(function (subfolders) {
                for (let f of subfolders) {
                    folders.push(f);
                }
                resolve(folders);
            });
            // } else {
            //     resolve(folders);
            // }
        });

        let p3 = new Promise((resolve) => {
            let folders = [];

            // if (!isRecursivelyExcluded(unsortedFolder.id)) {
            folders.push(unsortedFolder);

            unsortedFolder.getFolders(function (subfolders) {
                for (let f of subfolders) {
                    folders.push(f);
                }
                resolve(folders);
            });
            // } else {
            //     resolve(folders);
            // }
        });

        Promise.all([p1, p2, p3]).then(folders => {
            // Flatten array of arrays into array
            let merged = [].concat.apply([], folders);
            this.sortFolders(merged);
        });
    }

    /**
     * Set the sort criteria.
     * 
     * @param {string} firstSortCriteria The first sort criteria attribute.
     * @param {boolean} firstReverse Whether the first sort is reversed.
     * @param {string} secondReverse The second sort criteria attribute.
     * @param secondSortCriteria
     * @param folderSortCriteria
     * @param folderReverse
     * @param differentFolderOrder
     * @param caseInsensitive
     */
    setCriteria(firstSortCriteria, firstReverse, secondSortCriteria, secondReverse, folderSortCriteria, folderReverse, differentFolderOrder, caseInsensitive) {
        BookmarkSorter.prototype.firstReverse = firstReverse ? -1 : 1;
        BookmarkSorter.prototype.firstSortCriteria = firstSortCriteria;
        BookmarkSorter.prototype.secondReverse = secondReverse ? -1 : 1;
        BookmarkSorter.prototype.secondSortCriteria = secondSortCriteria;
        BookmarkSorter.prototype.folderReverse = folderReverse ? -1 : 1;
        BookmarkSorter.prototype.folderSortCriteria = folderSortCriteria;
        BookmarkSorter.prototype.differentFolderOrder = differentFolderOrder;
        BookmarkSorter.prototype.caseInsensitive = caseInsensitive;
        this.compare = this.createCompare();
    }

    /**
     * Sort and save a folder.
     * 
     * @param {Folder} folder The folder to sort and save.
     */
    sortAndSave(folder) {
        if (folder.canBeSorted()) {
            folder.getChildren(this.sortFolder, this.compare);
        }
    }

    /**
     * Sort the `folder` children.
     * 
     * @param {Folder} folder The folder to sort.
     */
    sortFolder(folder, compare) {
        let delta = 0;
        let length;

        for (let i = 0; i < folder.children.length; ++i) {
            folder.children[i].sort(compare);
            length = folder.children[i].length;
            for (let j = 0; j < length; ++j) {
                folder.children[i][j].setIndex(j + delta);
            }

            delta += length + 1;
        }

        folder.save();
    }

    /**
     * Sort the `folders`.
     * 
     * @param folders The folders to sort.
     */
    sortFolders(folders) {
        folders = folders instanceof Folder ? [folders] : folders;

        let self = this;
        let promiseAry = [];

        for (let folder of folders) {
            let p = new Promise((resolve) => {
                // Not obvious but arg1 = folder
                setTimeout((function (arg1) {
                    return function () {
                        self.sortAndSave(arg1);
                        // return true to indicate that sorting is finished
                        resolve(true);
                    };
                }(folder)), 0);
            });
            promiseAry.push(p);
        }

        Promise.all(promiseAry).then(bool => {
            if (bool) {
                log("sorting:end");
                self.sorting = false;
                self.lastCheck = Date.now();
                // wait for events caused by sorting to finish before listening again so the sorting is not triggered again
                setTimeout(function () {
                    bookmarkManager.createChangeListeners();
                }, 2000, "Javascript");
            }
        });
    }

    /**
     * Sort if not already sorting.
     */
    sortIfNotSorting() {
        if (!this.sorting) {
            // restart clock everytime there is an event triggered
            this.lastCheck = Date.now();
            // if already waiting, then don't wait again or there will be multiple loops
            if (!this.isWaiting) {
                this.sortIfNoChanges();
            }
        }
    }

    /**
     * Sort if no recent changes.
     */
    sortIfNoChanges() {
        if (!this.sorting) {
            // wait for a period of no activity before sorting
            var now = Date.now();
            var diff = now - this.lastCheck;
            if (diff < 3000) {
                this.isWaiting = true;
                var self = this;
                setTimeout(function () {
                    log("waiting one second for activity to stop");
                    self.sortIfNoChanges();
                }, 1000, "Javascript");
            } else {
                this.sorting = true;
                this.isWaiting = false;
                bookmarkManager.removeChangeListeners();
                log("sorting:begin");
                this.sortAllBookmarks();
            }
        }
    }
}

// =========
// FUNCTIONS
// =========

/**
 * If enabled, send message to console for debugging.
 *
 * @param {string} o Text to display on console.
 */
function log(o) {
    console.log(o);
}

/**
 * Convert a string to an integer.
 * 
 * @param {string} val String value to convert.
 * @returns {number}
 */
function parseInteger(val) {
    return parseInt(val, 10);
}

/**
 * Get current preference value or it's default value if not set.
 * 
 * @param {string} param Name of preference.
 * @returns {*} Value or default value of preference.
 */
function getPref(param) {
    let defaultValue = weh.prefs.$specs[param].defaultValue;
    let value = weh.prefs[param] || defaultValue;
    return value;
}

/**
 * Sort all bookmarks.
 */
function sortAllBookmarks() {
    bookmarkSorter.sortIfNotSorting();
}

/**
 * Sort if the auto sort option is on.
 */
function sortIfAuto() {
    if (getPref("auto_sort")) {
        sortAllBookmarks();
    }
}

/**
 * Adjust the sort criteria of the bookmark sorter.
 */
function adjustSortCriteria() {
    let differentFolderOrder = getPref("folder_sort_order") !== getPref("bookmark_sort_order");

    bookmarkSorter.setCriteria(sortCriterias[getPref("sort_by")], getPref("inverse"),
        sortCriterias[parseInteger(getPref("then_sort_by"))] || undefined, getPref("then_inverse"),
        sortCriterias[parseInteger(getPref("folder_sort_by"))], getPref("folder_inverse"),
        differentFolderOrder, getPref("case_insensitive")
    );

    // TODO: need to only sort when criteria is changed, otherwise, this is sorting on startup
    //sortIfAuto();
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

    // check if this is a first install or upgrade
    if (local_version !== asb.version.current()) {
        if (local_version === undefined) {
            log("First install");
        } else {
            log("Upgrade");
        }

        // update the localStorage version for next time
        asb.version.local("set");
    }
}

/**
 * Get the item description.
 *
 * @param {Bookmark} item The item.
 * @return {*} The item description.
 */
// function getDescription(item) {
//     let description = "";
//     // TODO: chrome bookmarks do not have descriptions
//     return description;
// }

/**
 * Get an item annotation.
 *
 * @param {string} id The item ID.
 * @param {string} name The item name.
 * @returns {*} The item annotation.
 */
// function getItemAnnotation(id, name) {
//     let annotation;
//     // TODO: chrome bookmarks do not have annotations, what about tags?
//     return annotation;
// }

/**
 * Check if an item has a do not sort annotation.
 *
 * @param {string} id The item ID.
 * @return {boolean} Whether the item has a do not sort annotation.
 */
// function hasDoNotSortAnnotation(id) {
//     let annotation = getItemAnnotation(id, "autosortbookmarks/donotsort");
//     return annotation !== undefined;
// }

/**
 * Check if an item has a recursive annotation.
 *
 * @param {string} id The item ID.
 * @return {boolean} Whether the item has a recursive annotation.
 */
// function hasRecursiveAnnotation(id) {
//     let annotation = getItemAnnotation(id, "autosortbookmarks/recursive");
//     return annotation !== undefined;
// }

/**
 * Check if an item is recursively excluded.
 *
 * @param {string} id The item ID.
 * @return {boolean} Whether the item is recursively excluded.
 */
// function isRecursivelyExcluded(id) {
//     return hasDoNotSortAnnotation(id) && hasRecursiveAnnotation(id);
// }

/**
 * Remove an item annotation.
 *
 * @param {string} id The item ID.
 * @param {string} name The item name.
 */
// function removeItemAnnotation(id, name) {
//     // TODO: chrome does not have annotations, what about tags?
// }

/**
 * Remove the do not sort annotation on an item.
 *
 * @param {string} id The item ID.
 */
// function removeDoNotSortAnnotation(id) {
//     removeItemAnnotation(id, "autosortbookmarks/donotsort");
// }

/**
 * Remove the recursive annotation on an item.
 *
 * @param {string} id The item ID.
 */
// function removeRecursiveAnnotation(id) {
//     removeItemAnnotation(id, "autosortbookmarks/recursive");
// }

/**
 * Set an item annotation.
 *
 * @param {string} id The item ID.
 * @param name The item name.
 * @param value The item value.
 */
// function setItemAnnotation(id, name, value) {
//     // TODO: chrome does not have annotations, what about tags?
// }

/**
 * Set the do not sort annotation on an item.
 * 
 * @param {string} id The item ID.
 */
// function setDoNotSortAnnotation(id) {
//     setItemAnnotation(id, "autosortbookmarks/donotsort", true);
// }

/**
 * Set the recursive annotation on an item.
 * @param {string} id The item ID.
 */
// function setRecursiveAnnotation(id) {
//     setItemAnnotation(id, "autosortbookmarks/recursive", true);
// }

/**
 * Reverse the base of an URL to do a better sorting.
 *
 * @param str The URL to be reversed.
 * @return {*} The reversed URL.
 */
function reverseBaseUrl(str) {
    if (!str) {
        return "";
    }

    // Used code generator: https://regex101.com/
    str = str.replace(/^\S+:\/\//, "");
    let re = /^[^/]+$|^[^/]+/;

    let m;

    if ((m = re.exec(str)) !== null) {
        if (m.index === re.lastIndex) {
            re.lastIndex++;
        }

        // Replace the found string by it's reversion
        str = str.replace(m[0], m[0].split(".").reverse().join("."));
    }

    return str;
}

/**
 * Create an item from the `type`.
 *
 * @param {string} type The item type.
 * @param {string} id The item ID.
 * @param {int} index The item index.
 * @param {string} parentId The parent ID.
 * @param {string} title The item title.
 * @param {string} url The item URL.
 * @param {int} lastVisited The timestamp of the last visit.
 * @param {int} accessCount The access count.
 * @param {int} dateAdded The timestamp of the date added.
 * @param {int} lastModified The timestamp of the last modified date.
 * @return {*} The new item.
 */
function createItem(type, id, index, parentId, title, url, lastVisited, accessCount, dateAdded, lastModified) {
    let item;

    if (type === "bookmark") {
        item = new Bookmark(id, index, parentId, title, dateAdded, lastModified, url, lastVisited, accessCount);
    } else if (type === "folder") {
        item = new Folder(id, index, parentId, title, dateAdded, lastModified);
    } else if (type === "separator") {
        item = new Separator(id, index, parentId);
    }

    return item;
}

/**
 * Create an item from the `node` type.
 *
 * @param {bookmarks.BookmarkTreeNode} node The node item.
 * @return {Item} The new item.
 */
function createItemFromNode(node) {
    // FF has a type attribute, but chrome doesn't, so we have to guess
    var nodeType = "bookmark";
    if (node.type !== undefined) {
        nodeType = node.type;
    } else {
        if (node.url === undefined) {
            nodeType = "folder";
        } else if (node.url === "data:") {
            nodeType = "separator";
        }
    }

    // TODO: map from FF to chrome attributes:
    // node.time
    // node.accessCount
    // node.dateAdded
    // node.lastModified
    return createItem(nodeType, node.id, node.index, node.parentId, node.title, node.url, node.time, node.accessCount, node.dateAdded, node.lastModified);
}

/**
 * Get the children folders of a folder.
 *
 * @param {string} parentId The parent ID.
 * @return {Array}
 */
function getChildrenFolders(parentId, callback) {
    browser.bookmarks.getChildren(parentId, function (o) {
        if (o !== undefined) {
            let children = [];
            let folder;

            for (let node of o) {
                // TODO: need to map FF to chrome: node.dateAdded, node.lastModified
                folder = new Folder(node.id, node.index, node.parentId, node.title, node.dateAdded, node.lastModified);

                children.push({
                    id: folder.id,
                    title: folder.title
                    // excluded: hasDoNotSortAnnotation(folder.id),
                    // recursivelyExcluded: hasRecursiveAnnotation(folder.id),
                });
            }

            if (typeof (callback) === "function") {
                callback(children);
            }
        }
    });
}

/**
 * Get the root folders.
 * 
 * @return {Array}
 */
function getRootFolders() {
    let folders = [];
    for (let folder of [menuFolder, toolbarFolder, unsortedFolder]) {
        folders.push({
            id: folder.id,
            title: folder.title
            // excluded: hasDoNotSortAnnotation(folder.id),
            // recursivelyExcluded: hasRecursiveAnnotation(folder.id),
        });
    }

    // TODO: do these need to be translated into other languages?
    // folders[0].title = "Bookmarks Menu";
    // folders[1].title = "Bookmarks Toolbar";
    // folders[2].title = "Unsorted Bookmarks";

    return folders;
}

/**
 * Show the page to configure the folders to exclude.
 */
function showConfigureFoldersToExclude() {
    return function () {
        /**
         * Send children.
         * @param worker
         * @returns {Function}
         */
        function sendChildren(worker) {
            return function (parentId) {
                getChildrenFolders(parentId, function (children) {
                    worker.port.emit("children", parentId, children);
                });
            };
        }

        let worker;

        /**
         * Handle onRemove event.
         * @param item
         */
        // function onRemove(item) {
        //     if (worker && item instanceof Folder) {
        //         worker.port.emit("remove-folder", item.id);
        //     }
        // }

        // bookmarkManager.on("remove", onRemove);

        browser.tabs.open({
            url: data.url("configureFolders.html"),
            onOpen: function (tab) {
                tab.on("ready", function () {
                    worker = tab.attach({
                        contentScriptFile: data.url("configureFolders.js")
                    });

                    // worker.port.on("sort-checkbox-change", function (folderID, activated) {
                    //     if (activated) {
                    //         removeDoNotSortAnnotation(folderID);
                    //     }
                    //     else {
                    //         setDoNotSortAnnotation(folderID);
                    //     }
                    // });

                    // worker.port.on("recursive-checkbox-change", function (folderID, activated) {
                    //     if (activated) {
                    //         setRecursiveAnnotation(folderID);
                    //     }
                    //     else {
                    //         removeRecursiveAnnotation(folderID);
                    //     }
                    // });

                    worker.port.on("query-children", sendChildren(worker));

                    const texts = {
                        recursiveText: "Recursive",
                        messageText: "The sub-folders are recursively excluded.",
                        loadingText: "Loading...",
                    };

                    worker.port.emit("init", getRootFolders(), data.url("add.png"), data.url("remove.png"), texts);
                });
            },

            onClose: function () {
                worker = null;
                //bookmarkManager.removeListener("remove", onRemove);
            },
        });
    };
}

/**
 * Print bookmarks.
 * 
 * @param {*} bookmarks 
 */
// function printBookmarks(bookmarks) {
//     bookmarks.forEach(function (bookmark) {
//         console.debug(bookmark.id + " - " + bookmark.title + " - " + bookmark.url);
//         if (bookmark.children)
//             printBookmarks(bookmark.children);
//     });
// }
// browser.bookmarks.getTree(function (bookmarks) {
//     printBookmarks(bookmarks);
// });

// ====
// MAIN
// ====

log("main:begin");

const data = self.data;
const sortCriterias = [
    "title",
    "url"
];

let toolbarFolder = new Folder(asb.rootID.bookmarks_bar);
let menuFolder = new Folder(asb.rootID.other_bookmarks);
let unsortedFolder = new Folder(asb.rootID.mobile_bookmarks);

var bookmarkSorter = new BookmarkSorter();

var bookmarkManager = new BookmarkManager();

installOrUpgradePrefs();
registerUserEvents();
adjustSortCriteria();

log("main:end");
