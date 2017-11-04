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

// TODO: port excluded folders feature
/* global annotationService */
/* global descriptionAnnotation */
/* global livemarkAnnotation */
/* global smartBookmarkAnnotation */
/* exported showConfigureFoldersToExclude */

// TODO: port historyService
/* exported createItemFromNode */

// =======
// CLASSES
// =======

/**
 * Various settings.
 */
let asb = {
    "auto_sort": true,
    // only set to true while debugging, set to false when released
    "log": true,
    "status": {
        "listeners_active": false,
        "sort_active": 0
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
        log("BookmarkManager");

        setTimeout(this.createChangeListeners, 500);
    }

    /**
     * Create bookmark change listeners.
     */
    createChangeListeners() {
        log("BookmarkManager.createChangeListeners");

        if (asb.status.sort_active > 0) {
            setTimeout(this.createChangeListeners, 500);
        } else {
            asb.status.listeners_active = true;

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

            log("All listeners created");
        }
    }
}

/**
 * Item class.
 */
class Item {
    /**
     * Get an item.
     *
     * @param itemID
     * @param index
     * @param parentID
     */
    constructor(itemID, index, parentID) {
        log("Item");

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
        log("Item.getFolders");

        return createItem(browser.bookmarks.folderID, this.parentID);
    }

    /**
     * Save the new index.
     */
    saveIndex() {
        log("Item.saveIndex");

        try {
            browser.bookmarks.setItemIndex(this.id, this.index);
        }
        catch (exception) {
            // console.error("failed to move " + this.id + ". " + this.title + " to " + this.index + " (" + this.url + ")");
        }
    }

    /**
     * Set the new `index` saving the old index.
     *
     * @param {int} index The new index.
     */
    setIndex(index) {
        log("Item.setIndex");

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
     * @param {int} itemID The bookmark identifier.
     * @param {int} index The bookmark position.
     * @param {int} parentID The bookmark parent identifier.
     * @param {string} title The bookmark title.
     * @param {string} url The item URL.
     * @param {int} lastVisited The timestamp of the last visit.
     * @param {int} accessCount The access count.
     * @param {int} dateAdded The timestamp of the date added.
     * @param {int} lastModified The timestamp of the last modified date.
     */
    constructor(itemID, index, parentID, title, dateAdded, lastModified, url, lastVisited, accessCount) {
        super(itemID, index, parentID);

        log("Bookmark");

        if (title === null || dateAdded === null || lastModified === null || url === null || lastVisited === null || accessCount === null) {
            // console.error("Corrupted bookmark found. ID: " + itemID + " - Title: " + title + " - URL: " + url);
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
     * @param itemID
     * @returns {boolean}
     */
    exists(itemID) {
        log("Bookmark.exists");

        return browser.bookmarks.getItemIndex(itemID) >= 0;
    }
}

/**
 * Separator class.
 */
class Separator extends Item {
    /**
     * Get a separator.
     *
     * @param {int} itemID The separator identifier.
     * @param {int} index The separator position.
     * @param {int} parentID The separator parent identifier.
     */
    constructor(itemID, index, parentID) {
        super(itemID, index, parentID);

        log("Separator");
    }
}

/**
 * Folder class.
 */
class Folder extends Bookmark {
    /**
     * Get an existing folder.
     *
     * @param {int} itemID The folder identifier.
     * @param {int} index The folder position.
     * @param {int} parentID The folder parent identifier.
     * @param {string} title The folder title.
     * @param dateAdded
     * @param lastModified
     */
    constructor(itemID, index, parentID, title, dateAdded, lastModified) {
        super(itemID, index, parentID, title, dateAdded, lastModified);
        log("Folder");
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
     * @return {Array.<Item>} The children.
     */
    getChildren() {
        log("Folder.getChildren");

        // let index = 0;

        this.children = [[]];

        // TODO: port to browser.bookmarks.getChildren()

        // let options = historyService.getNewQueryOptions();
        // options.queryType = historyService.QUERY_TYPE_BOOKMARKS;

        // let query = historyService.getNewQuery();
        // query.setFolders([this.id], 1);

        // let result = historyService.executeQuery(query, options);

        // let rootNode = result.root;
        // rootNode.containerOpen = true;

        // for (let i = 0; i < rootNode.childCount; ++i) {
        //     let node = rootNode.getChild(i);
        //     let item = createItemFromNode(node, this.id);
        //     if (item instanceof Separator) {
        //         this.children.push([]);
        //         ++index;
        //     }
        //     else if (item !== undefined) {
        //         this.children[index].push(item);
        //     }
        // }

        // rootNode.containerOpen = false;

        return this.children;
    }

    /**
     * Get folders recursively.
     */
    getFolders() {
        log("Folder.getFolders");

        let folders = [];

        // let folder;
        // let node;

        // TODO: port to browser.bookmarks.getChildren()

        // let options = historyService.getNewQueryOptions();
        // options.excludeItems = true;
        // options.excludeQueries = true;
        // options.queryType = historyService.QUERY_TYPE_BOOKMARKS;

        // let query = historyService.getNewQuery();
        // query.setFolders([this.id], 1);

        // let result = historyService.executeQuery(query, options);

        // let rootNode = result.root;
        // rootNode.containerOpen = true;

        // for (let i = 0; i < rootNode.childCount; ++i) {
        //     node = rootNode.getChild(i);

        //     if (!isRecursivelyExcluded(node.itemId)) {
        //         folder = new Folder(node.itemId, node.bookmarkIndex, this.id, node.title, node.dateAdded, node.lastModified);

        //         if (!isLivemark(folder.id)) {
        //             folders.push(folder);

        //             for (let f of folder.getFolders()) {
        //                 folders.push(f);
        //             }
        //         }
        //     }
        // }

        // rootNode.containerOpen = false;

        return folders;
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
            // TODO: maybe parentID is already set?
            // let parentID = getFolderIdForItem(this.id);
            let parentID = 0;
            if (parentID > 0) {
                let parentFolder = createItem(browser.bookmarks.folderID, parentID);
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

        return this.id === browser.bookmarks.placesRoot;
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
     * @param {int} itemID The folder identifier.
     * @param {int} index The folder position.
     * @param {int} parentID The folder parent identifier.
     * @param {string} title The folder title.
     * @param dateAdded
     * @param lastModified
     */
    constructor(itemID, index, parentID, title, dateAdded, lastModified) {
        super(itemID, index, parentID, title, dateAdded, lastModified);

        log("Livemark");

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
     * @param {int} itemID The folder identifier.
     * @param {int} index The folder position.
     * @param {int} parentID The folder parent identifier.
     * @param {string} title The folder title.
     */
    constructor(itemID, index, parentID, title) {
        super(itemID, index, parentID, title);

        log("SmarkBookmark");

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
        log("BookmarkSorter");

        /**
         * Indicates if sorting is in progress.
         */
        this.sorting = false;

        /**
         * Indicates if there was a change which means a sort is needed.
         */
        this.changed = false;

        /**
         * Delay for thread which checks for change.
         */
        this.delay = 3000;

        this.sortIfChanged();
    }

    /**
     * Create a bookmark comparator.
     */
    createCompare() {
        log("BookmarkSorter.createCompare");

        let comparator;

        /**
         * Check for corrupted and order flags
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
         * Add reverse URLs
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

                for (let f of menuFolder.getFolders()) {
                    folders.push(f);
                }
            }

            resolve(folders);
        });

        let p2 = new Promise((resolve) => {
            let folders = [];

            if (!isRecursivelyExcluded(toolbarFolder.id)) {
                folders.push(toolbarFolder);

                for (let f of toolbarFolder.getFolders()) {
                    folders.push(f);
                }
            }

            resolve(folders);
        });

        let p3 = new Promise((resolve) => {
            let folders = [];

            if (!isRecursivelyExcluded(unsortedFolder.id)) {
                folders.push(unsortedFolder);

                for (let f of unsortedFolder.getFolders()) {
                    folders.push(f);
                }
            }

            resolve(folders);
        });

        Promise.all([p1, p2, p3]).then(folders => {
            // Flatten array of arrays into array
            let merged = [].concat.apply([], folders);
            this.sortFolders(merged);
        });
    }

    /**
     * Set the sort criteria.
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
     * @param {Folder} folder The folder to sort and save.
     */
    sortAndSave(folder) {
        log("BookmarkSorter.sortAndSave");

        if (folder.canBeSorted()) {
            let self = this;
            self.sortFolder(folder);
            // browser.bookmarks.runInBatchMode({
            //     runBatched() {
            //         folder.save();
            //     },
            // }, null);
            folder.save();
        }
    }

    /**
     * Sort the `folder` children.
     * @param {Folder} folder The folder to sort.
     */
    sortFolder(folder) {
        log("BookmarkSorter.sortFolder");

        folder.getChildren();

        let delta = 0;
        let length;

        for (let i = 0; i < folder.children.length; ++i) {
            folder.children[i].sort(this.compare);
            length = folder.children[i].length;
            for (let j = 0; j < length; ++j) {
                folder.children[i][j].setIndex(j + delta);
            }

            delta += length + 1;
        }
    }

    /**
     * Sort the `folders`.
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
                        resolve(true);
                    };
                }(folder)), 0);
            });
            promiseAry.push(p);
        }

        Promise.all(promiseAry).then(bool => {
            if (bool) {
                self.sorting = false;
                self.changed = false;
            }
        });
    }

    /**
     * Set flag to trigger sorting.
     */
    setChanged() {
        log("BookmarkSorter.setChanged");

        this.changed = true;
    }

    /**
     * Perform sorting only if there was a change and not already sorting.
     */
    sortIfChanged() {
        log("BookmarkSorter.sortIfChanged");

        if (this.changed && !this.sorting) {
            this.sorting = true;
            this.sortAllBookmarks();
        }

        let self = this;

        setTimeout(function () {
            self.sortIfChanged();
        }, this.delay);
    }
}

// =========
// FUNCTIONS
// =========

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
 * Sort all bookmarks.
 */
function sortAllBookmarks() {
    log("sortAllBookmarks");

    bookmarkSorter.setChanged();
}

/**
 * Sort if the auto sort option is on.
 */
function sortIfAuto() {
    log("sortIfAuto");

    if (asb.auto_sort) {
        sortAllBookmarks();
    }
}

/**
 * Adjust the sort criteria of the bookmark sorter.
 */
function adjustSortCriteria() {
    log("adjustSortCriteria");

    let differentFolderOrder = weh.prefs["folder_sort_order"] !== weh.prefs["livemark_sort_order"] && weh.prefs["folder_sort_order"] !== weh.prefs["smart_bookmark_sort_order"] && weh.prefs["folder_sort_order"] !== weh.prefs["bookmark_sort_order"];
    bookmarkSorter.setCriteria(sortCriterias[weh.prefs["sort_by"]], weh.prefs["inverse"],
        sortCriterias[parseInt(weh.prefs["then_sort_by"])] || undefined, weh.prefs["then_inverse"],
        sortCriterias[parseInt(weh.prefs["folder_sort_by"])], weh.prefs["folder_inverse"],
        differentFolderOrder, weh.prefs["case_insensitive"]
    );
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
 * @param {*} item The item.
 * @return {*} The item description.
 */
function getDescription(item) {
    log("getDescription, item=" + item);

    let description;
    try {
        description = annotationService.getItemAnnotation(item.id, descriptionAnnotation);
    }
    catch (exception) {
        description = "";
    }

    return description;
}

/**
 * Get an item annotation.
 *
 * @param itemID The item ID.
 * @param name The item name.
 * @returns {*} The item annotation.
 */
function getItemAnnotation(itemID, name) {
    log("getItemAnnotation, itemID=" + itemID);

    let annotation;
    try {
        annotation = annotationService.getItemAnnotation(itemID, name);
    }
    catch (exception) {
        // Do nothing.
    }

    return annotation;
}

/**
 * Check if an item has a do not sort annotation.
 *
 * @param itemID
 * @return {boolean}
 */
function hasDoNotSortAnnotation(itemID) {
    log("hasDoNotSortAnnotation, itemID=" + itemID);

    let annotation = getItemAnnotation(itemID, "autosortbookmarks/donotsort");
    return annotation !== undefined;
}

/**
 * Check if an item has a recursive annotation.
 *
 * @param itemID
 * @return {boolean}
 */
function hasRecursiveAnnotation(itemID) {
    log("hasRecursiveAnnotation, itemID=" + itemID);

    let annotation = getItemAnnotation(itemID, "autosortbookmarks/recursive");
    return annotation !== undefined;
}

/**
 * Check if an item is recursively excluded.
 *
 * @param itemID
 * @return {boolean}
 */
function isRecursivelyExcluded(itemID) {
    log("isRecursivelyExcluded, itemID=" + itemID);

    return hasDoNotSortAnnotation(itemID) && hasRecursiveAnnotation(itemID);
}

/**
 * Check whether `itemID` is a livemark.
 *
 * @param {int} itemID The item ID.
 * @return {*} Whether the item is a livemark or not.
 */
function isLivemark(itemID) {
    log("isLivemark, itemID=" + itemID);

    return annotationService.itemHasAnnotation(itemID, livemarkAnnotation);
}

/**
 * Check whether `itemID` is a smart bookmark.
 *
 * @param {int} itemID The item ID.
 * @return {boolean} Whether the item is a smart bookmark or not.
 */
function isSmartBookmark(itemID) {
    log("isSmartBookmark, itemID=" + itemID);

    return annotationService.itemHasAnnotation(itemID, smartBookmarkAnnotation);
}

/**
 * Remove an item annotation.
 *
 * @param itemID
 * @param name
 */
function removeItemAnnotation(itemID, name) {
    log("removeItemAnnotation, itemID=" + itemID);

    annotationService.removeItemAnnotation(itemID, name);
}

/**
 * Remove the do not sort annotation on an item.
 *
 * @param itemID
 */
function removeDoNotSortAnnotation(itemID) {
    log("removeDoNotSortAnnotation, itemID=" + itemID);

    removeItemAnnotation(itemID, "autosortbookmarks/donotsort");
}

/**
 * Remove the recursive annotation on an item.
 *
 * @param itemID
 */
function removeRecursiveAnnotation(itemID) {
    log("removeRecursiveAnnotation, itemID=" + itemID);

    removeItemAnnotation(itemID, "autosortbookmarks/recursive");
}

/**
 * Set an item annotation.
 *
 * @param itemID
 * @param name
 * @param value
 */
function setItemAnnotation(itemID, name, value) {
    log("setItemAnnotation, itemID=" + itemID);

    if (Bookmark.exists(itemID)) {
        annotationService.setItemAnnotation(itemID, name, value, 0, annotationService.EXPIRE_NEVER);
    }
}

/**
 * Set the do not sort annotation on an item.
 * @param itemID
 */
function setDoNotSortAnnotation(itemID) {
    log("setDoNotSortAnnotation, itemID=" + itemID);

    setItemAnnotation(itemID, "autosortbookmarks/donotsort", true);
}

/**
 * Set the recursive annotation on an item.
 * @param itemID
 */
function setRecursiveAnnotation(itemID) {
    log("setRecursiveAnnotation, itemID=" + itemID);

    setItemAnnotation(itemID, "autosortbookmarks/recursive", true);
}

/**
 * Reverse the base of an URL to do a better sorting.
 *
 * @param str
 * @return {*}
 */
function reverseBaseUrl(str) {
    log("reverseBaseUrl, url=" + str);

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
 * @param {int} type The item type.
 * @param {int} itemID The item ID.
 * @param {int} parentID The parent ID.
 * @param {string} title The item title.
 * @param {string} url The item URL.
 * @param {int} lastVisited The timestamp of the last visit.
 * @param {int} accessCount The access count.
 * @param {int} dateAdded The timestamp of the date added.
 * @param {int} lastModified The timestamp of the last modified date.
 * @return {*} The new item.
 * @param index
 */
function createItem(type, itemID, index, parentID, title, url, lastVisited, accessCount, dateAdded, lastModified) {
    log("createItem");

    let item;
    switch (type) {
        case browser.bookmarks.TYPE_BOOKMARK:
            if (isSmartBookmark(itemID)) {
                item = new SmartBookmark(itemID, index, parentID, title);
            }
            else {
                item = new Bookmark(itemID, index, parentID, title, dateAdded, lastModified, url, lastVisited, accessCount);
            }

            break;
        case browser.bookmarks.TYPE_FOLDER:
            if (isLivemark(itemID)) {
                item = new Livemark(itemID, index, parentID, title, dateAdded, lastModified);
            }
            else {
                item = new Folder(itemID, index, parentID, title, dateAdded, lastModified);
            }

            break;
        case browser.bookmarks.TYPE_SEPARATOR:
            item = new Separator(itemID, index, parentID);
            break;
    }

    return item;
}

/**
 * Create an item from the `node` type.
 *
 * @param {object} node The node item.
 * @param {int} parentID The parent ID.
 * @return {Item} The new item.
 */
function createItemFromNode(node, parentID) {
    log("createItemFromNode, node=" + node + ", parentID=" + parentID);

    let type;
    switch (node.type) {
        case node.RESULT_TYPE_URI:
            type = browser.bookmarks.TYPE_BOOKMARK;
            break;
        case node.RESULT_TYPE_FOLDER:
            type = browser.bookmarks.TYPE_FOLDER;
            break;
        case node.RESULT_TYPE_SEPARATOR:
            type = browser.bookmarks.TYPE_SEPARATOR;
            break;
        case node.RESULT_TYPE_QUERY:
            type = browser.bookmarks.TYPE_BOOKMARK;
            break;
    }

    return createItem(type, node.itemId, node.bookmarkIndex, parentID, node.title, node.uri, node.time, node.accessCount, node.dateAdded, node.lastModified);
}

/**
 * Get the children folders of a folder.
 *
 * @param parentID
 * @return {Array}
 */
function getChildrenFolders(parentID) {
    log("getChildrenFolders, parentID=" + parentID);

    let children = [];

    // let folder;
    // let node;

    // TODO: port to browser.bookmarks.getChildren()

    // let options = historyService.getNewQueryOptions();
    // options.excludeItems = true;
    // options.excludeQueries = true;
    // options.queryType = historyService.QUERY_TYPE_BOOKMARKS;

    // let query = historyService.getNewQuery();
    // query.setFolders([parentID], 1);

    // let result = historyService.executeQuery(query, options);

    // let rootNode = result.root;
    // rootNode.containerOpen = true;

    // for (let i = 0; i < rootNode.childCount; ++i) {
    //     node = rootNode.getChild(i);

    //     folder = new Folder(node.itemId, node.bookmarkIndex, parentID, node.title, node.dateAdded, node.lastModified);

    //     if (!isLivemark(folder.id)) {
    //         children.push({
    //             id: folder.id,
    //             title: folder.title,
    //             excluded: hasDoNotSortAnnotation(folder.id),
    //             recursivelyExcluded: hasRecursiveAnnotation(folder.id),
    //         });
    //     }
    // }

    // rootNode.containerOpen = false;

    return children;
}

/**
 * Get the root folders.
 */
function getRootFolders() {
    log("getFolders");

    let folders = [];
    for (let folder of [menuFolder, toolbarFolder, unsortedFolder]) {
        folders.push({
            id: folder.id,
            excluded: hasDoNotSortAnnotation(folder.id),
            recursivelyExcluded: hasRecursiveAnnotation(folder.id),
        });
    }

    folders[0].title = "Bookmarks Menu";
    folders[1].title = "Bookmarks Toolbar";
    folders[2].title = "Unsorted Bookmarks";

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
                let children = getChildrenFolders(parentID);
                worker.port.emit("children", parentID, children);
            };
        }

        let worker;

        /**
         * Handle onRemove event.
         * @param item
         */
        function onRemove(item) {
            if (worker && item instanceof Folder) {
                worker.port.emit("remove-folder", item.id);
            }
        }

        bookmarkManager.on("remove", onRemove);

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

// ====
// MAIN
// ====

log("main:begin");

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

/**
 * The bookmarks menu folder.
 *
 * @type {Folder}
 */
let menuFolder = new Folder(browser.bookmarks.menuFolder);

/**
 * The bookmarks toolbar folder.
 *
 * @type {Folder}
 */
let toolbarFolder = new Folder(browser.bookmarks.toolbarFolder);

/**
 * The unsorted bookmarks folder.
 *
 * @type {Folder}
 */
let unsortedFolder = new Folder(browser.bookmarks.unsortedFolder);

var bookmarkSorter = new BookmarkSorter();
var bookmarkManager = new BookmarkManager();

installOrUpgradePrefs();
registerUserEvents();
adjustSortCriteria();

log("main:end");
