/*
 * Copyright (C) 2014-2016  Boucher, Antoni <bouanto@zoho.com>
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

const {Class} = require("sdk/core/heritage");
const {isRecursivelyExcluded} = require("lib/annotations");
const {Folder, menuFolder, toolbarFolder, unsortedFolder} = require("lib/bookmarks");
const {setTimeout} = require("sdk/timers");
const {Cc, Ci, Cu} = require("chrome");
const bookmarkService = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);

/**
 * Reverse the base of an URL to do a better sorting
 */
function reverseBaseUrl(str) {
    if (!str) {
        return "";
    }

    /* Used code generator: https://regex101.com/ */
    str = str.replace(/^\S+:\/\//, "");
    let re = /^[^\/]+$|^[^\/]+/;

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
 * Bookmark sorter class.
 */
let BookmarkSorter = new Class({
    isChanged: false,
    thread: null,
    delay: 3000,

    /**
     * Get a bookmark sorter.
     * @constructor
     */
    initialize: function () {
        this.sortIfChanged();
    },

    /**
     * Create a bookmark comparator.
     */
    createCompare: function () {
        let comparator;

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
    },

    /**
     * Get all the folders as a flat list.
     * @return {Array.<Folder>} The folders.
     */
    getAllFolders: function () {
        let folders = [];

        if (!isRecursivelyExcluded(menuFolder.id)) {
            folders.push(menuFolder);

            for (let f of menuFolder.getFolders()) {
                folders.push(f);
            }
        }

        if (!isRecursivelyExcluded(toolbarFolder.id)) {
            folders.push(toolbarFolder);

            for (let f of toolbarFolder.getFolders()) {
                folders.push(f);
            }
        }

        if (!isRecursivelyExcluded(unsortedFolder.id)) {
            folders.push(unsortedFolder);

            for (let f of unsortedFolder.getFolders()) {
                folders.push(f);
            }
        }

        return folders;
    },

    /**
     * Set the sort criteria.
     * @param {string} firstSortCriteria The first sort criteria attribute.
     * @param {boolean} firstReverse Whether the first sort is reversed.
     * @param {string} secondReverse The second sort criteria attribute.
     * @param {boolean} secondReverse Whether the second sort is reversed.
     */
    setCriteria: function (firstSortCriteria, firstReverse, secondSortCriteria, secondReverse, folderSortCriteria, folderReverse, differentFolderOrder, caseInsensitive) {
        BookmarkSorter.prototype.firstReverse = firstReverse ? -1 : 1;
        BookmarkSorter.prototype.firstSortCriteria = firstSortCriteria;
        BookmarkSorter.prototype.secondReverse = secondReverse ? -1 : 1;
        BookmarkSorter.prototype.secondSortCriteria = secondSortCriteria;
        BookmarkSorter.prototype.folderReverse = folderReverse ? -1 : 1;
        BookmarkSorter.prototype.folderSortCriteria = folderSortCriteria;
        BookmarkSorter.prototype.differentFolderOrder = differentFolderOrder;
        BookmarkSorter.prototype.caseInsensitive = caseInsensitive;
        this.compare = this.createCompare();
    },

    /**
     * Sort all bookmarks.
     */
    sortAllBookmarks: function () {
        console.log("sortAllBookmarks::begin");
        var start = new Date().getTime();

        let self = this;
        var p1 = new Promise(
            function (resolve, reject) {
                resolve(self.getAllFolders());
            }
        );
        p1.then(
            function (folders) {
                console.log("sortFolders::begin");
                var start = new Date().getTime();
                bookmarkService.runInBatchMode({
                    runBatched(param) {
                        self.sortFolders(folders);
                    },
                }, null);
                var end = new Date().getTime();
                var time = end - start;
                console.log("sortFolders::end,elapsed=" + time + "ms");
            }
        )
        .catch(
            function (reason) {
                console.error('Rejected promise: ' + reason);
            }
        );

        var end = new Date().getTime();
        var time = end - start;
        console.log("sortAllBookmarks::end,elapsed=" + time + "ms");
    },

    /**
     * Sort and save a folder.
     * @param {Folder} folder The folder to sort and save.
     */
    sortAndSave: function (folder) {
        if (folder.canBeSorted()) {
            this.sortFolder(folder);
            folder.save();
        }
    },

    /**
     * Sort the `folder` children.
     * @param {Folder} folder The folder to sort.
     */
    sortFolder: function (folder) {
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
    },

    /**
     * Sort the `folders`.
     * @param {Array.<Folder>|Folder} folders The folders to sort.
     */
    sortFolders: function (folders) {
        folders = folders instanceof Folder ? [folders] : folders;

        for (let folder of folders) {
            this.sortAndSave(folder);
        }
    },

    /**
     * Set flag to trigger sorting.
     */
    setChanged: function () {
        this.isChanged = true;
    },

    /**
     * Set sort delay.
     * @param delay The delay for automatic sorting.
     */
    setDelay: function (delay) {
        if (delay >= 3000) {
            this.delay = delay;
        }
    },

    /**
     * Perform sorting only if there was a change.
     */
    sortIfChanged: function () {
        if (this.isChanged) {
            this.sortAllBookmarks();
            this.isChanged = false;
        }

        let self = this;

        setTimeout(function () {
            self.sortIfChanged();
        }, this.delay);

        // FIXME: use pref for delay value
    },

});

exports.BookmarkSorter = BookmarkSorter;
