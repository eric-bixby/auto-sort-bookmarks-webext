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

// =======
// CLASSES
// =======

// TODO: add a mapping function so works for both browsers
// mapping chrome to FF bookmark id (chrome-id, ff-id, ff-title):
// "0"   = "root________" = "?"
// "1"   = "toolbar_____" = "Bookmarks Toolbar"
// "2"   = "menu________" = "Bookmarks Menu"
// "3"   = "mobile______" = "Mobile Bookmarks" (not used by FF)
// undef = "unfiled_____" = "Other Bookmarks" (not used by chrome)

/**
 * Various settings.
 */
let asb = {
    "rootId": "root________",
    "rootFolderIds": [
        "toolbar_____",
        "menu________",
        "mobile______",
        "unfiled_____"
    ],
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
        log("onChanged: " + id);
        log(changeInfo);
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
        log("onCreated: " + id);
        log(bookmark);
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
        log("onMoved: " + id);
        log(moveInfo);
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
        log("onRemoved: " + id);
        log(removeInfo);
        if (getNodeType(removeInfo.node) === "separator") {
            sortIfAuto();
        }
        else if (getNodeType(removeInfo.node) === "folder") {
            weh.rpc.call("remove-folder", removeInfo.node.id);
        }
    }

    /**
     * Visited event handler.
     * 
     * @param {any} historyItem 
     * @memberof BookmarkManager
     */
    handleVisited(historyItem) {
        log("onVisited");
        log(historyItem);
        if (!historyItem.url.startsWith("moz-extension:")) {
            sortIfAuto();
        }
    }

    /**
     * Add listeners.
     * 
     * @memberof BookmarkManager
     */
    createChangeListeners() {
        browser.bookmarks.onChanged.addListener(this.handleChanged);
        browser.bookmarks.onCreated.addListener(this.handleCreated);
        browser.bookmarks.onMoved.addListener(this.handleMoved);
        browser.bookmarks.onRemoved.addListener(this.handleRemoved);
        browser.history.onVisited.addListener(this.handleVisited);
        log("added listeners");
    }

    /**
     * Remove listeners.
     * 
     * @memberof BookmarkManager
     */
    removeChangeListeners() {
        browser.bookmarks.onChanged.removeListener(this.handleChanged);
        browser.bookmarks.onCreated.removeListener(this.handleCreated);
        browser.bookmarks.onMoved.removeListener(this.handleMoved);
        browser.bookmarks.onRemoved.removeListener(this.handleRemoved);
        browser.history.onVisited.removeListener(this.handleVisited);
        log("removed listeners");
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
        return browser.bookmarks.move(this.id, { index: this.index });
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
            log("ERROR: Corrupted bookmark found. ID: " + id + " - Title: " + title + " - URL: " + url);
            this.corrupted = true;
        }

        this.title = title || "";
        this.url = url || "";
        this.lastVisited = lastVisited || 0;
        this.accessCount = accessCount || 0;
        this.dateAdded = dateAdded || 0;
        this.lastModified = lastModified || 0;
        this.order = getPref("bookmark_sort_order");
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
    getChildren(callback, compare, resolve) {
        this.children = [[]];
        var self = this;

        browser.bookmarks.getChildren(this.id, function (o) {
            if (o !== undefined) {
                let promiseAry = [];

                for (let node of o) {
                    node.type = getNodeType(node);
                    if (node.type === "bookmark") {
                        // history.getVisits() is faster than history.search() because
                        // history.search() checks title and url, plus does not match url exactly, so it takes longer.
                        var p = browser.history.getVisits({
                            url: node.url
                        });
                        promiseAry.push(p);
                    } else {
                        promiseAry.push(Promise.resolve());
                    }
                }

                Promise.all(promiseAry).then(values => {
                    // populate nodes with visit information
                    for (var i = 0; i < values.length; i++) {
                        if (values[i] !== undefined && values[i].length > 0) {
                            o[i].accessCount = values[i].length;
                            o[i].lastVisited = values[i][0].visitTime;
                        }
                    }

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

                    if (typeof callback === "function") {
                        callback(self, compare, resolve);
                    }
                });

            } else {
                resolve();
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
                        if (node.url === undefined && !tags.isRecursivelyExcluded(node.id)) {
                            folder = new Folder(node.id, node.index, node.parentId, node.title, node.dateAdded, 0);
                            if (self.id === node.id) {
                                isTop = true;
                            }

                            self.folders.push(folder);
                            getSubFolders(node.children);
                        }
                    }

                    // only return the complete list if this is the top interition
                    if (isTop && typeof callback === "function") {
                        callback(self.folders);
                    }
                }
            }
            return getSubFolders;
        })());
    }

    /**
     * Check if this folder is excluded because ancestor is set to recursively exclude.
     *
     * @returns {boolean} Whether this folder is excluded or not.
     */
    hasAncestorExcluded() {
        if (tags.isRecursivelyExcluded(this.id)) {
            return true;
        }
        else {
            if (!this.isRoot()) {
                let parentFolder = createItem("folder", this.parentId);
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
        return this.parentId === asb.rootId;
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
    save(resolve) {
        if (this.hasMove()) {
            let promiseAry = [];

            for (let i = 0; i < this.children.length; ++i) {
                let length = this.children[i].length;
                for (let j = 0; j < length; ++j) {
                    let p = this.children[i][j].saveIndex();
                    promiseAry.push(p);
                }
            }

            Promise.all(promiseAry).then(function () {
                if (typeof resolve === "function") {
                    resolve();
                }
            });
        } else {
            resolve();
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
        if (["title", "url", "revurl"].indexOf(BookmarkSorter.prototype.firstSortCriteria) !== -1) {
            firstComparator = function (bookmark1, bookmark2) {
                addReverseUrls(bookmark1, bookmark2, BookmarkSorter.prototype.firstSortCriteria);
                return bookmark1[BookmarkSorter.prototype.firstSortCriteria].localeCompare(bookmark2[BookmarkSorter.prototype.firstSortCriteria], undefined, compareOptions) * BookmarkSorter.prototype.firstReverse;
            };
        }
        else {
            // sort numerically: dateAdded, lastModified, accessCount, lastVisited
            firstComparator = function (bookmark1, bookmark2) {
                return (bookmark1[BookmarkSorter.prototype.firstSortCriteria] - bookmark2[BookmarkSorter.prototype.firstSortCriteria]) * BookmarkSorter.prototype.firstReverse;
            };
        }

        let secondComparator;
        if (BookmarkSorter.prototype.secondSortCriteria !== undefined && BookmarkSorter.prototype.secondSortCriteria !== "none") {
            if (["title", "url", "revurl"].indexOf(BookmarkSorter.prototype.secondSortCriteria) !== -1) {
                secondComparator = function (bookmark1, bookmark2) {
                    addReverseUrls(bookmark1, bookmark2, BookmarkSorter.prototype.secondSortCriteria);
                    return bookmark1[BookmarkSorter.prototype.secondSortCriteria].localeCompare(bookmark2[BookmarkSorter.prototype.secondSortCriteria], undefined, compareOptions) * BookmarkSorter.prototype.secondReverse;
                };
            }
            else {
                // sort numerically: dateAdded, lastModified, accessCount, lastVisited
                secondComparator = function (bookmark1, bookmark2) {
                    return (bookmark1[BookmarkSorter.prototype.secondSortCriteria] - bookmark2[BookmarkSorter.prototype.secondSortCriteria]) * BookmarkSorter.prototype.secondReverse;
                };
            }
        }
        else {
            // no sorting
            secondComparator = function () {
                return 0;
            };
        }

        // combine the first and second comparators
        let itemComparator = function (bookmark1, bookmark2) {
            return firstComparator(bookmark1, bookmark2) || secondComparator(bookmark1, bookmark2);
        };

        if (BookmarkSorter.prototype.differentFolderOrder) {
            if (BookmarkSorter.prototype.folderSortCriteria !== undefined && BookmarkSorter.prototype.folderSortCriteria !== "none") {
                // sort folders, then sort bookmarks
                comparator = function (bookmark1, bookmark2) {
                    if (bookmark1 instanceof Folder && bookmark2 instanceof Folder) {
                        if (["title"].indexOf(BookmarkSorter.prototype.folderSortCriteria) !== -1) {
                            return bookmark1[BookmarkSorter.prototype.folderSortCriteria].localeCompare(bookmark2[BookmarkSorter.prototype.folderSortCriteria], undefined, compareOptions) * BookmarkSorter.prototype.folderReverse;
                        }

                        // numeric sort
                        return (bookmark1[BookmarkSorter.prototype.folderSortCriteria] - bookmark2[BookmarkSorter.prototype.folderSortCriteria]) * BookmarkSorter.prototype.folderReverse;
                    }

                    return itemComparator(bookmark1, bookmark2);
                };
            }
            else {
                // no sorting
                comparator = function (bookmark1, bookmark2) {
                    if (bookmark1 instanceof Folder && bookmark2 instanceof Folder) {
                        return 0;
                    }

                    return itemComparator(bookmark1, bookmark2);
                };
            }
        }
        else {
            // sort bookmarks and folders with same order
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
        let promiseAry = [];

        for (let id of asb.rootFolderIds) {
            let folder = new Folder(id);

            let p = new Promise((resolve) => {
                let folders = [];

                if (!tags.isRecursivelyExcluded(id)) {
                    folders.push(folder);

                    folder.getFolders(function (subfolders) {
                        for (let f of subfolders) {
                            folders.push(f);
                        }
                        resolve(folders);
                    });
                } else {
                    resolve(folders);
                }
            });

            promiseAry.push(p);
        }

        Promise.all(promiseAry).then(folders => {
            // Flatten array of arrays into array
            let merged = [].concat.apply([], folders);
            this.sortFolders(merged);
        });
    }

    /**
     * Set sort criteria.
     * 
     * @param {any} firstSortCriteria 
     * @param {any} firstReverse 
     * @param {any} secondSortCriteria 
     * @param {any} secondReverse 
     * @param {any} folderSortCriteria 
     * @param {any} folderReverse 
     * @param {any} differentFolderOrder 
     * @param {any} caseInsensitive 
     * @memberof BookmarkSorter
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
    sortAndSave(folder, resolve) {
        if (folder.canBeSorted()) {
            folder.getChildren(this.sortFolder, this.compare, resolve);
        } else {
            resolve();
        }
    }

    /**
     * Sort the `folder` children.
     * 
     * @param {Folder} folder The folder to sort.
     */
    sortFolder(folder, compare, resolve) {
        let delta = 0;
        let length;

        // children is an array of arrays where a separator node is used to separate lists
        for (let i = 0; i < folder.children.length; ++i) {
            // sort each array of nodes
            folder.children[i].sort(compare);
            // assign new index to each node
            length = folder.children[i].length;
            for (let j = 0; j < length; ++j) {
                folder.children[i][j].setIndex(j + delta);
            }

            delta += length + 1;
        }

        // move nodes based on new index
        folder.save(resolve);
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
            // create an array of promises
            let p = new Promise((resolve) => {
                self.sortAndSave(folder, resolve);
            });

            promiseAry.push(p);
        }

        Promise.all(promiseAry).then(function () {
            log("sort:end");
            self.sorting = false;
            self.lastCheck = Date.now();
            // wait for events caused by sorting to finish before listening again so the sorting is not triggered again
            setTimeout(function () {
                bookmarkManager.createChangeListeners();
            }, 3000, "Javascript");
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
            var delay = parseInteger(getPref("delay")) * 1000;
            if (diff < delay) {
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
                log("sort:begin");
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
 * @param {string} txt Text to display on console.
 */
function log(txt) {
    if (getPref("logging")) {
        console.log(txt);
    }
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
    let value = weh.prefs[param];
    if (value === undefined) {
        value = defaultValue;
    }
    // log("pref " + param + " = " + value);
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

    bookmarkSorter.setCriteria(
        getPref("sort_by"),
        getPref("inverse"),
        getPref("then_sort_by"),
        getPref("then_inverse"),
        getPref("folder_sort_by"),
        getPref("folder_inverse"),
        differentFolderOrder,
        getPref("case_insensitive")
    );
}

/**
 * Reigster listeners for pref changes.
 */
function registerPrefListeners() {
    weh.prefs.on("auto_sort", sortIfAuto);

    let preferences = ["folder_sort_order", "bookmark_sort_order"];
    for (let preference of preferences) {
        weh.prefs.on(preference, sortIfAuto);
    }

    weh.prefs.on("case_insensitive", adjustSortCriteria);
    weh.prefs.on("sort_by", adjustSortCriteria);
    weh.prefs.on("then_sort_by", adjustSortCriteria);
    weh.prefs.on("folder_sort_by", adjustSortCriteria);
    weh.prefs.on("inverse", adjustSortCriteria);
    weh.prefs.on("then_inverse", adjustSortCriteria);
    weh.prefs.on("folder_inverse", adjustSortCriteria);
    weh.prefs.on("folder_sort_order", adjustSortCriteria);
    weh.prefs.on("bookmark_sort_order", adjustSortCriteria);
}

/**
 * Register user events.
 */
function registerUserEvents() {
    weh.rpc.listen({
        openSettings: () => {
            weh.ui.open("settings", {
                type: "tab",
                url: "content/settings.html"
            });
            weh.ui.close("main");
        },
        openTranslation: () => {
            weh.ui.open("translation", {
                type: "tab",
                url: "content/translation.html"
            });
            weh.ui.close("main");
        },
        openConfigureFolders: () => {
            weh.ui.open("configure-folders", {
                type: "tab",
                url: "content/configure-folders.html"
            });
            weh.ui.close("main");
        },
        sort: () => {
            sortAllBookmarks();
            weh.ui.close("main");
        },
        sortCheckboxChange: (folderID, activated) => {
            if (activated) {
                tags.removeDoNotSortAnnotation(folderID);
            }
            else {
                tags.setDoNotSortAnnotation(folderID);
            }
        },
        recursiveCheckboxChange: (folderID, activated) => {
            if (activated) {
                tags.setRecursiveAnnotation(folderID);
            }
            else {
                tags.removeRecursiveAnnotation(folderID);
            }
        },
        queryRoot: () => {
            const texts = {
                recursiveText: "Recursive",
                messageText: "The sub-folders are recursively excluded.",
                loadingText: "Loading...",
            };
            weh.rpc.call("configure-folders", "root", getRootFolders(), "content/images/add.png", "content/images/remove.png", texts);
        },
        queryChildren: (parentId) => {
            getChildrenFolders(parentId, function (children) {
                weh.rpc.call("configure-folders", "children", parentId, children);
            });
        },
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
            weh.ui.open("settings", {
                type: "tab",
                url: "content/settings.html"
            });
        } else {
            log("Upgrade");
            // TODO convert 3.0 preference to 3.1
        }

        // update the localStorage version for next time
        asb.version.local("set");
    }
}

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
    return createItem(node.type, node.id, node.index, node.parentId, node.title, node.url, node.lastVisited, node.accessCount, node.dateAdded, node.dateGroupModified);
}

/**
 * Get the type of node.
 * 
 * @param {any} node 
 * @returns 
 */
function getNodeType(node) {
    let type = "bookmark";
    if (node.type !== undefined) {
        type = node.type;
    } else {
        if (node.url === undefined) {
            type = "folder";
        } else if (node.url === "data:") {
            type = "separator";
        }
    }
    log("node.type=" + type);
    return type;
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
            for (let node of o) {
                children.push({
                    id: node.id,
                    title: node.title,
                    excluded: tags.hasDoNotSortAnnotation(node.id),
                    recursivelyExcluded: tags.hasRecursiveAnnotation(node.id),
                });
            }

            if (typeof callback === "function") {
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
    for (let id of asb.rootFolderIds) {
        folders.push({
            id: id,
            excluded: tags.hasDoNotSortAnnotation(id),
            recursivelyExcluded: tags.hasRecursiveAnnotation(id)
        });
    }

    return folders;
}

// ====
// MAIN
// ====

var tags = require("annotations");

var weh = require("weh-background");

// declare default values
weh.prefs.declare(require("default-prefs"));

// log() depends on weh being defined and declare() being called
log("main:begin");

installOrUpgradePrefs();

var bookmarkSorter = new BookmarkSorter();
adjustSortCriteria();

var bookmarkManager = new BookmarkManager();
registerUserEvents();
registerPrefListeners();

log("main:end");
