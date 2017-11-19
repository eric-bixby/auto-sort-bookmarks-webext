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

// mapping chrome to mdn bookmark id:
// 0 = "root________"
// 1 = "toolbar_____"
// 2 = "menu________"
// 3 = "mobile______" (undef)
// undef = "unfiled_____"

/**
 * Various settings.
 */
let asb = {
    // only set to true while debugging, set to false when released
    "log": true,
    // "rootID": {
    //     "bookmarks_bar": "1",
    //     "other_bookmarks": "2",
    //     "mobile_bookmarks": "3"
    // },
    "rootID": {
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
 */
class BookmarkManager {
    /**
     * Create bookmark listeners.
     */
    constructor() {
        log("new BookmarkManager()");

        this.createChangeListeners();
    }

    /**
     * Create bookmark change listeners.
     */
    createChangeListeners() {
        log("BookmarkManager.createChangeListeners");

        browser.bookmarks.onChanged.addListener(function (id, changeInfo) {
            log("onChanged id = " + id + " " + changeInfo);
            sortIfAuto();
        });

        browser.bookmarks.onCreated.addListener(function (id, bookmark) {
            log("onCreated id = " + id + " " + bookmark);
            sortIfAuto();
        });

        browser.bookmarks.onMoved.addListener(function (id, moveInfo) {
            log("onMoved id = " + id + " " + moveInfo);
            sortIfAuto();
        });

        browser.bookmarks.onRemoved.addListener(function (id, removeInfo) {
            // TODO: check if item is separator, sort if true
            log("onRemoved id = " + id + " " + removeInfo);
            sortIfAuto();
        });
    }
}

/**
 * Item class.
 */
class Item {
    /**
     * Get an item.
     *
     * @param {string} itemID
     * @param {int} index
     * @param {string} parentID
     */
    constructor(itemID, index, parentID) {
        log("new Item(itemID=" + itemID + ", index=" + index + ", parentID=" + parentID + ")");

        this.id = itemID;
        this.setIndex(index);
        this.parentID = parentID;
    }

    /**
     * Get the parent folder.
     *
     * @return {Item} The parent folder.
     */
    getFolder() {
        log("Item.getFolder");

        return createItem("folder", this.parentID);
    }

    /**
     * Save the new index.
     */
    saveIndex() {
        log("Item.saveIndex");

        browser.bookmarks.move(this.id, { index: this.index });
    }

    /**
     * Set the new `index` saving the old index.
     *
     * @param {int} index The new index.
     */
    setIndex(index) {
        log("Item.setIndex(index=" + index + ")");

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
     * @param {string} itemID The bookmark identifier.
     * @param {int} index The bookmark position.
     * @param {string} parentID The bookmark parent identifier.
     * @param {string} title The bookmark title.
     * @param {string} url The item URL.
     * @param {int} lastVisited The timestamp of the last visit.
     * @param {int} accessCount The access count.
     * @param {int} dateAdded The timestamp of the date added.
     * @param {int} lastModified The timestamp of the last modified date.
     */
    constructor(itemID, index, parentID, title, dateAdded, lastModified, url, lastVisited, accessCount) {
        super(itemID, index, parentID);

        log("new Bookmark(itemID=" + itemID + ")");

        if (title === null || dateAdded === null || lastModified === null || url === null || lastVisited === null || accessCount === null) {
            log("Corrupted bookmark found. ID: " + itemID + " - Title: " + title + " - URL: " + url);
            this.corrupted = true;
        }

        this.title = title || "";
        this.url = url || "";
        this.lastVisited = lastVisited || 0;
        this.accessCount = accessCount || 0;
        this.dateAdded = dateAdded || 0;
        this.lastModified = lastModified || 0;
        this.order = weh.prefs["bookmark_sort_order"] || 4;
        this.description = getDescription(this) || "";
        this.setKeyword();
    }

    /**
     * Fetch the keyword and set it to the current bookmark.
     */
    setKeyword() {
        log("Bookmark.setKeyword");

        let keyword = "";
        try {
            keyword = browser.bookmarks.getKeywordForBookmark(this.id);
            keyword = keyword || "";
        }
        catch (exception) {
            // Nothing to do.
        }

        this.keyword = keyword;
    }

    /**
     * Determine if bookmark exists.
     *
     * @param {string} itemID
     * @returns {boolean} Whether the bookmark exists.
     */
    exists(itemID) {
        log("Bookmark.exists(itemID=" + itemID + ")");

        return parseInteger(browser.bookmarks.getItemIndex(itemID)) >= 0;
    }
}

/**
 * Separator class.
 */
class Separator extends Item {
    /**
     * Get a separator.
     *
     * @param {string} itemID The separator identifier.
     * @param {int} index The separator position.
     * @param {string} parentID The separator parent identifier.
     */
    constructor(itemID, index, parentID) {
        super(itemID, index, parentID);

        log("new Separator(itemID=" + itemID + ")");
    }
}

/**
 * Folder class.
 */
class Folder extends Bookmark {
    /**
     * Get an existing folder.
     *
     * @param {string} itemID The folder identifier.
     * @param {int} index The folder position.
     * @param {string} parentID The folder parent identifier.
     * @param {string} title The folder title.
     * @param {int} dateAdded The timestamp of the date added.
     * @param {int} lastModified The timestamp of the last modified date.
     */
    constructor(itemID, index, parentID, title, dateAdded, lastModified) {
        super(itemID, index, parentID, title, dateAdded, lastModified);
        log("new Folder(itemID=" + itemID + ")");
        this.order = weh.prefs["folder_sort_order"] || 1;
    }

    /**
     * Check if this folder can be sorted.
     *
     * @return {boolean} Whether it can be sorted or not.
     */
    canBeSorted() {
        log("Folder.canBeSorted");

        if (hasDoNotSortAnnotation(this.id) || this.hasAncestorExcluded()) {
            return false;
        }

        return !this.isRoot();
    }

    /**
     * Get the immediate children.
     * 
     * @param {*} callback The callback.
     */
    getChildren(callback, compare) {
        log("Folder.getChildren");

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
     */
    getFolders(callback) {
        log("Folder.getFolders");

        browser.bookmarks.getChildren(this.id, function (o) {
            if (o !== undefined) {
                let folders = [];
                let folder;

                for (let node of o) {
                    if (!isRecursivelyExcluded(node.id)) {
                        // TODO: get chrome equivilant of node.dateAdded, node.lastModified
                        folder = new Folder(node.id, node.index, node.parentId, node.title, node.dateAdded, node.lastModified);

                        if (!isLivemark(folder.id)) {
                            folders.push(folder);

                            folder.getFolders(function (f) {
                                folders.push(f);
                            });
                        }
                    }
                }

                if (typeof (callback) === "function") {
                    callback(folders);
                }
            }
        });
    }

    /**
     * Check if this folder has an ancestor that is recursively excluded.
     */
    hasAncestorExcluded() {
        log("Folder.hasAncestorExcluded");

        if (isRecursivelyExcluded(this.id)) {
            return true;
        }
        else {
            // TODO: get id of folder
            // let parentID = getFolderIdForItem(this.id);
            let parentID = 0;
            if (parentID > 0) {
                let parentFolder = createItem("folder", parentID);
                return parentFolder.hasAncestorExcluded();
            }
        }

        return false;
    }

    /**
     * Check if this folder is a root folder (menu, toolbar, unsorted).
     *
     * @return {boolean} Whether this is a root folder or not.
     */
    isRoot() {
        log("Folder.isRoot");

        return this.parentID === "0";
    }

    /**
     * Check if at least one children has moved.
     *
     * @return {boolean} Whether at least one children has moved or not.
     */
    hasMove() {
        log("Folder.hasMove");

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
        log("Folder.save");

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
 * Livemark class.
 */
class Livemark extends Bookmark {
    /**
     * Get an existing smart bookmark.
     *
     * @param {string} itemID The folder identifier.
     * @param {int} index The folder position.
     * @param {string} parentID The folder parent identifier.
     * @param {string} title The folder title.
     * @param {int} dateAdded The timestamp of the date added.
     * @param {int} lastModified The timestamp of the last modified date.
     */
    constructor(itemID, index, parentID, title, dateAdded, lastModified) {
        super(itemID, index, parentID, title, dateAdded, lastModified);

        log("new Livemark(itemID=" + itemID + ")");

        this.order = weh.prefs["livemark_sort_order"] || 2;
    }
}

/**
 * Smart bookmark class.
 */
class SmartBookmark extends Bookmark {
    /**
     * Get an existing smart bookmark.
     *
     * @param {string} itemID The folder identifier.
     * @param {int} index The folder position.
     * @param {string} parentID The folder parent identifier.
     * @param {string} title The folder title.
     */
    constructor(itemID, index, parentID, title) {
        super(itemID, index, parentID, title);

        log("new SmarkBookmark(itemID=" + itemID + ")");

        this.order = weh.prefs["smart_bookmark_sort_order"] || 3;
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
        log("new BookmarkSorter()");

        /**
         * Indicates if sorting is in progress.
         */
        this.sorting = false;
    }

    /**
     * Create a bookmark comparator.
     */
    createCompare() {
        log("BookmarkSorter.createCompare");

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
        log("BookmarkSorter.sortAllBookmarks");

        let p1 = new Promise((resolve) => {
            let folders = [];

            if (!isRecursivelyExcluded(menuFolder.id)) {
                folders.push(menuFolder);

                menuFolder.getFolders(function (subfolders) {
                    for (let f of subfolders) {
                        folders.push(f);
                    }
                    resolve(folders);
                });
            } else {
                resolve(folders);
            }
        });

        let p2 = new Promise((resolve) => {
            let folders = [];

            if (!isRecursivelyExcluded(toolbarFolder.id)) {
                folders.push(toolbarFolder);

                toolbarFolder.getFolders(function (subfolders) {
                    for (let f of subfolders) {
                        folders.push(f);
                    }
                    resolve(folders);
                });
            } else {
                resolve(folders);
            }
        });

        let p3 = new Promise((resolve) => {
            let folders = [];

            if (!isRecursivelyExcluded(unsortedFolder.id)) {
                folders.push(unsortedFolder);

                unsortedFolder.getFolders(function (subfolders) {
                    for (let f of subfolders) {
                        folders.push(f);
                    }
                    resolve(folders);
                });
            } else {
                resolve(folders);
            }
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
        log("BookmarkSorter.setCriteria");

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
        log("BookmarkSorter.sortAndSave");

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
        log("BookmarkSorter.sortFolder");

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
        log("BookmarkSorter.sortFolders");

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
                self.sorting = false;
            }
        });
    }

    /**
     * Sort if not already sorting.
     */
    sortIfNotSorting() {
        if (!this.sorting) {
            this.sorting = true;
            this.sortAllBookmarks();
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
    if (asb.log) {
        console.log(o);
    }
}

/**
 * Convert a string to an integer.
 * 
 * @param {string} val String value to convert.
 */
function parseInteger(val) {
    return parseInt(val, 10);
}

/**
 * Sort all bookmarks.
 */
function sortAllBookmarks() {
    log("sortAllBookmarks");

    bookmarkSorter.sortIfNotSorting();
}

/**
 * Sort if the auto sort option is on.
 */
function sortIfAuto() {
    log("sortIfAuto");

    // TODO: always sorting until preferences are working
    sortAllBookmarks();
    // if (weh.prefs["auto_sort"]) {
    //     sortAllBookmarks();
    // }
}

/**
 * Adjust the sort criteria of the bookmark sorter.
 */
function adjustSortCriteria() {
    log("adjustSortCriteria");

    let differentFolderOrder = weh.prefs["folder_sort_order"] !== weh.prefs["livemark_sort_order"] && weh.prefs["folder_sort_order"] !== weh.prefs["smart_bookmark_sort_order"] && weh.prefs["folder_sort_order"] !== weh.prefs["bookmark_sort_order"];

    bookmarkSorter.setCriteria(sortCriterias[weh.prefs["sort_by"]], weh.prefs["inverse"],
        sortCriterias[parseInteger(weh.prefs["then_sort_by"])] || undefined, weh.prefs["then_inverse"],
        sortCriterias[parseInteger(weh.prefs["folder_sort_by"])], weh.prefs["folder_inverse"],
        differentFolderOrder, weh.prefs["case_insensitive"]
    );

    // TODO: need to only sort when criteria changes, otherwise, this is sorting on startup
    sortIfAuto();
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
 * Install or upgrade prefs.
 */
function installOrUpgradePrefs() {
    log("installOrUpgradePrefs");

    let local_version = asb.version.local();

    // check if this is a first install
    if (local_version !== asb.version.current()) {
        if (local_version === undefined) {
            // first install
            log("First install");
            for (var param in weh.prefs.getAll()) {
                let value = weh.prefs.$specs[param].defaultValue;
                log("param=" + param + ", defaultValue=" + value);
                weh.prefs[param] = value;
            }
            // TODO: save to localStorage
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
function getDescription(item) {
    log("getDescription(itemID=" + item.id + ")");

    let description;
    try {
        // TODO: chrome bookmarks do not have descriptions
        description = "";
    }
    catch (exception) {
        description = "";
    }

    log("description=" + description);

    return description;
}

/**
 * Get an item annotation.
 *
 * @param {string} itemID The item ID.
 * @param {string} name The item name.
 * @returns {*} The item annotation.
 */
function getItemAnnotation(itemID, name) {
    log("getItemAnnotation(itemID=" + itemID + ",name=" + name + ")");

    let annotation;
    try {
        // TODO: chrome bookmarks do not have annotations, what about tags?
    }
    catch (exception) {
        // Do nothing.
    }

    return annotation;
}

/**
 * Check if an item has a do not sort annotation.
 *
 * @param {string} itemID The item ID.
 * @return {boolean} Whether the item has a do not sort annotation.
 */
function hasDoNotSortAnnotation(itemID) {
    log("hasDoNotSortAnnotation(itemID=" + itemID + ")");

    let annotation = getItemAnnotation(itemID, "autosortbookmarks/donotsort");
    return annotation !== undefined;
}

/**
 * Check if an item has a recursive annotation.
 *
 * @param {string} itemID The item ID.
 * @return {boolean} Whether the item has a recursive annotation.
 */
function hasRecursiveAnnotation(itemID) {
    log("hasRecursiveAnnotation(itemID=" + itemID + ")");

    let annotation = getItemAnnotation(itemID, "autosortbookmarks/recursive");
    return annotation !== undefined;
}

/**
 * Check if an item is recursively excluded.
 *
 * @param {string} itemID The item ID.
 * @return {boolean} Whether the item is recursively excluded.
 */
function isRecursivelyExcluded(itemID) {
    log("isRecursivelyExcluded(itemID=" + itemID + ")");

    return hasDoNotSortAnnotation(itemID) && hasRecursiveAnnotation(itemID);
}

/**
 * Check whether `itemID` is a livemark.
 *
 * @param {string} itemID The item ID.
 * @return {*} Whether the item is a livemark or not.
 */
function isLivemark(itemID) {
    log("isLivemark(itemID=" + itemID + ")");

    // TODO: does Livemark exist under chrome?
    // return annotationService.itemHasAnnotation(itemID, livemarkAnnotation);
    return false;
}

/**
 * Check whether `itemID` is a smart bookmark.
 *
 * @param {string} itemID The item ID.
 * @return {boolean} Whether the item is a smart bookmark or not.
 */
function isSmartBookmark(itemID) {
    log("isSmartBookmark(itemID=" + itemID + ")");

    // TODO: does SmartBookmark exist under chrome?
    // return annotationService.itemHasAnnotation(itemID, smartBookmarkAnnotation);
    return false;
}

/**
 * Remove an item annotation.
 *
 * @param {string} itemID The item ID.
 * @param {string} name The item name.
 */
function removeItemAnnotation(itemID, name) {
    log("removeItemAnnotation(itemID=" + itemID + ",name=" + name + ")");

    // TODO: chrome does not have annotations, what about tags?
}

/**
 * Remove the do not sort annotation on an item.
 *
 * @param {string} itemID The item ID.
 */
function removeDoNotSortAnnotation(itemID) {
    log("removeDoNotSortAnnotation(itemID=" + itemID + ")");

    removeItemAnnotation(itemID, "autosortbookmarks/donotsort");
}

/**
 * Remove the recursive annotation on an item.
 *
 * @param {string} itemID The item ID.
 */
function removeRecursiveAnnotation(itemID) {
    log("removeRecursiveAnnotation(itemID=" + itemID + ")");

    removeItemAnnotation(itemID, "autosortbookmarks/recursive");
}

/**
 * Set an item annotation.
 *
 * @param {string} itemID The item ID.
 * @param name The item name.
 * @param value The item value.
 */
function setItemAnnotation(itemID, name, value) {
    log("setItemAnnotation(itemID=" + itemID + ",name=" + name + ",value=" + value + ")");

    if (Bookmark.exists(itemID)) {
        // TODO: chrome does not have annotations, what about tags?
    }
}

/**
 * Set the do not sort annotation on an item.
 * 
 * @param {string} itemID The item ID.
 */
function setDoNotSortAnnotation(itemID) {
    log("setDoNotSortAnnotation(itemID=" + itemID + ")");

    setItemAnnotation(itemID, "autosortbookmarks/donotsort", true);
}

/**
 * Set the recursive annotation on an item.
 * @param {string} itemID The item ID.
 */
function setRecursiveAnnotation(itemID) {
    log("setRecursiveAnnotation(itemID=" + itemID + ")");

    setItemAnnotation(itemID, "autosortbookmarks/recursive", true);
}

/**
 * Reverse the base of an URL to do a better sorting.
 *
 * @param str The URL to be reversed.
 * @return {*} The reversed URL.
 */
function reverseBaseUrl(str) {
    log("reverseBaseUrl(url=" + str + ")");

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
 * @param {string} itemID The item ID.
 * @param {int} index The item index.
 * @param {string} parentID The parent ID.
 * @param {string} title The item title.
 * @param {string} url The item URL.
 * @param {int} lastVisited The timestamp of the last visit.
 * @param {int} accessCount The access count.
 * @param {int} dateAdded The timestamp of the date added.
 * @param {int} lastModified The timestamp of the last modified date.
 * @return {*} The new item.
 */
function createItem(type, itemID, index, parentID, title, url, lastVisited, accessCount, dateAdded, lastModified) {
    log("createItem(type=" + type + ",itemID=" + itemID + ",title=" + title + ")");

    let item;

    if (type === "bookmark") {
        if (isSmartBookmark(itemID)) {
            item = new SmartBookmark(itemID, index, parentID, title);
        }
        else {
            item = new Bookmark(itemID, index, parentID, title, dateAdded, lastModified, url, lastVisited, accessCount);
        }
    } else if (type === "folder") {
        if (isLivemark(itemID)) {
            item = new Livemark(itemID, index, parentID, title, dateAdded, lastModified);
        }
        else {
            item = new Folder(itemID, index, parentID, title, dateAdded, lastModified);
        }
    } else if (type === "separator") {
        item = new Separator(itemID, index, parentID);
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
    log("createItemFromNode(nodeID=" + node.id + ")");

    // chrome doesn't have a type, so we have to guess
    var nodeType = "bookmark";
    if (node.url === undefined) {
        nodeType = "folder";
    }

    // TODO: need to detect separator

    // TODO: map from MDN to chrome attributes:
    // node.time
    // node.accessCount
    // node.dateAdded
    // node.lastModified
    return createItem(nodeType, node.id, node.index, node.parentId, node.title, node.url, node.time, node.accessCount, node.dateAdded, node.lastModified);
}

/**
 * Get the children folders of a folder.
 *
 * @param {string} parentID The parent ID.
 * @return {Array}
 */
function getChildrenFolders(parentID, callback) {
    log("getChildrenFolders(parentID=" + parentID + ")");

    browser.bookmarks.getChildren(parentID, function (o) {
        if (o !== undefined) {
            let children = [];
            let folder;

            for (let node of o) {
                // TODO: need to map MDN to chrome: node.dateAdded, node.lastModified
                folder = new Folder(node.id, node.index, node.parentId, node.title, node.dateAdded, node.lastModified);

                if (!isLivemark(folder.id)) {
                    children.push({
                        id: folder.id,
                        title: folder.title,
                        excluded: hasDoNotSortAnnotation(folder.id),
                        recursivelyExcluded: hasRecursiveAnnotation(folder.id),
                    });
                }
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
    log("getRootFolders");

    let folders = [];
    for (let folder of [menuFolder, toolbarFolder, unsortedFolder]) {
        folders.push({
            id: folder.id,
            title: folder.title,
            excluded: hasDoNotSortAnnotation(folder.id),
            recursivelyExcluded: hasRecursiveAnnotation(folder.id),
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
            return function (parentID) {
                getChildrenFolders(parentID, function (children) {
                    worker.port.emit("children", parentID, children);
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

                    worker.port.on("sort-checkbox-change", function (folderID, activated) {
                        if (activated) {
                            removeDoNotSortAnnotation(folderID);
                        }
                        else {
                            setDoNotSortAnnotation(folderID);
                        }
                    });

                    worker.port.on("recursive-checkbox-change", function (folderID, activated) {
                        if (activated) {
                            setRecursiveAnnotation(folderID);
                        }
                        else {
                            removeRecursiveAnnotation(folderID);
                        }
                    });

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
function printBookmarks(bookmarks) {
    bookmarks.forEach(function (bookmark) {
        console.debug(bookmark.id + " - " + bookmark.title + " - " + bookmark.url);
        if (bookmark.children)
            printBookmarks(bookmark.children);
    });
}

// ====
// MAIN
// ====

log("main:begin");

// chrome.bookmarks.getTree(function (bookmarks) {
//     printBookmarks(bookmarks);
// });

const data = self.data;
const sortCriterias = [
    "title",
    "url",
    "description",
    "keyword",
    "dateAdded",
    "lastModified",
    "lastVisited",
    "accessCount",
    "revurl"
];

let toolbarFolder = new Folder(asb.rootID.bookmarks_bar);
let menuFolder = new Folder(asb.rootID.other_bookmarks);
let unsortedFolder = new Folder(asb.rootID.mobile_bookmarks);

var bookmarkSorter = new BookmarkSorter();

new BookmarkManager();

installOrUpgradePrefs();
registerUserEvents();
adjustSortCriteria();

log("main:end");
