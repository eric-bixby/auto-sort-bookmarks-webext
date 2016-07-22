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

const {Cc, Ci, Cu} = require("chrome");
const {defer} = require("sdk/core/promise");
const {MENU, TOOLBAR, UNSORTED} = require("sdk/places/bookmarks");
const {reset} = require("sdk/preferences/service");
const self = require("sdk/self");
const windows = require("sdk/windows").browserWindows;
const windowUtils = require("sdk/window/utils");
const annotationService = Cc["@mozilla.org/browser/annotation-service;1"].getService(Ci.nsIAnnotationService);
const asyncHistory = Cc["@mozilla.org/browser/history;1"].getService(Ci.mozIAsyncHistory);
const bookmarkService = Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService);
const ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
const {Bookmark, Folder, Livemark, menuFolder, Separator, SmartBookmark, toolbarFolder, unsortedFolder} = require("lib/bookmarks");
const descriptionAnnotation = "bookmarkProperties/description";
const livemarkFeedAnnotation = "livemark/feedURI";
const livemarkReadOnlyAnnotation = "placesInternal/READ_ONLY";
const livemarkSiteAnnotation = "livemark/siteURI";
const smartBookmarkAnnotation = "Places/SmartBookmark";
const {removeDoNotSortAnnotation, removeRecursiveAnnotation, setDoNotSortAnnotation, setRecursiveAnnotation} = require("lib/annotations");

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "PlacesUtils", "resource://gre/modules/PlacesUtils.jsm");

function ignore(folder) {
    setDoNotSortAnnotation(folder.id);
    setRecursiveAnnotation(folder.id);
}

function sort(folder) {
    removeDoNotSortAnnotation(folder.id);
    removeRecursiveAnnotation(folder.id);
}

function bookmarkToString(bookmark) {
    return bookmark.id + ". " + bookmark.title;
}

/**
 * Assert the equality of the bookmarks array/generator.
 * @param {Function|Array.<Object>} bookmarks1 The actual bookmarks.
 * @param {Function|Array.<Object>} bookmarks2 The expected bookmarks.
 */
function assertBookmarksArray(assert, bookmarks1, bookmarks2) {
    let generatedBookmarks1 = [];
    for (let value of bookmarks1) {
        generatedBookmarks1.push(value);
    }

    let generatedBookmarks2 = [];
    for (let value of bookmarks2) {
        generatedBookmarks2.push(value);
    }

    let equality = true;
    if (generatedBookmarks1.length === generatedBookmarks2.length) {
        for (let i = 0; i < generatedBookmarks1.length; ++i) {
            equality = equality && generatedBookmarks1[i].id === generatedBookmarks2[i].id && generatedBookmarks1[i].title === generatedBookmarks2[i].title && generatedBookmarks1[i].url === generatedBookmarks2[i].url;
        }
    }
    else {
        equality = false;
    }

    let bookmarks1String = JSON.stringify(generatedBookmarks1.map(bookmarkToString));
    let bookmarks2String = JSON.stringify(generatedBookmarks2.map(bookmarkToString));
    assert.ok(equality, "\nResult:   " + (generatedBookmarks1.length > 0 ? bookmarks1String : "[]") + "\n !==\nExpected: " + (generatedBookmarks2.length > 0 ? bookmarks2String : "[]"));
}

/**
 * Create, save and get a new bookmark.
 * @param {string} title The bookmark name.
 * @param {string} url The bookmark URL.
 * @param {Folder} parent The parent folder.
 * @param {int} index The bookmark index.
 * @return {Bookmark} The new bookmark.
 */
function createBookmark(title, url, parent, index) {
    index = index !== undefined ? index : bookmarkService.DEFAULT_INDEX;
    let itemID = bookmarkService.insertBookmark(parent.id, ioService.newURI(url, null, null), index, title);
    return new Bookmark(itemID, index, parent.id, title, undefined, undefined, url);
}

/**
 * Create, save and get a new folder.
 * @param {string} title The folder name.
 * @param {Folder} parent The parent folder.
 * @param {int} index The folder index.
 * @return {Folder} The new folder.
 */
function createFolder(title, parent, index) {
    index = index !== undefined ? index : bookmarkService.DEFAULT_INDEX;
    let itemID = bookmarkService.createFolder(parent.id, title, index);
    return new Folder(itemID, index, parent.id, title);
}

/**
 * Create, save and get a new livemark.
 * @param {string} title The livemark name.
 * @param {string} url The livemark feed URL.
 * @param {Folder} parent The parent folder.
 * @param {int} index The livemark index.
 * @return {Livemark} The new livemark.
 */
function createLivemark(title, url, parent, index) {
    index = index !== undefined ? index : bookmarkService.DEFAULT_INDEX;
    let itemID = bookmarkService.createFolder(parent.id, title, index);
    annotationService.setItemAnnotation(itemID, livemarkFeedAnnotation, url, 0, Ci.nsIAnnotationService.EXPIRE_NEVER);
    annotationService.setItemAnnotation(itemID, livemarkReadOnlyAnnotation, 1, 0, Ci.nsIAnnotationService.EXPIRE_NEVER);
    annotationService.setItemAnnotation(itemID, livemarkSiteAnnotation, url, 0, Ci.nsIAnnotationService.EXPIRE_NEVER);
    return new Livemark(itemID, index, parent.id, title);
}

/**
 * Create, save and get a new separator.
 * @param {Folder} parent The parent folder.
 * @param {int} index The separator index.
 * @return {Separator} The new separator.
 */
function createSeparator(parent, index) {
    index = index !== undefined ? index : bookmarkService.DEFAULT_INDEX;
    let itemID = bookmarkService.insertSeparator(parent.id, index);
    return new Separator(itemID, index, parent.id);
}

/**
 * Create, save and get a new bookmark.
 * @param {string} title The bookmark name.
 * @param {string} smartBookmarkValue The smart bookmark value.
 * @param {string} url The bookmark URL.
 * @param {Folder} parent The parent folder.
 * @param {int} index The bookmark index.
 * @return {Bookmark} The new bookmark.
 */
function createSmartBookmark(title, smartBookmarkValue, url, parent, index) {
    index = index !== undefined ? index : bookmarkService.DEFAULT_INDEX;
    let itemID = bookmarkService.insertBookmark(parent.id, ioService.newURI(url, null, null), index, title);
    annotationService.setItemAnnotation(itemID, smartBookmarkAnnotation, smartBookmarkValue, 0, Ci.nsIAnnotationService.EXPIRE_NEVER);
    return new SmartBookmark(itemID, index, parent.id, title);
}

/**
 * Delete `item`.
 * @param {Item} item The item to delete.
 */
function deleteItem(item) {
    bookmarkService.removeItem(item.id);
}

/**
 * Get all the folders as a flat list.
 * @return {Array.<Folder>} The folders.
 */
function getAllFolders() {
    let folders = [];

    folders.push(menuFolder);
    yield menuFolder;

    folders.push(toolbarFolder);
    yield toolbarFolder;

    folders.push(unsortedFolder);
    yield unsortedFolder;

    for (let i = 0, length = folders.length; i < length; ++i) {
        for (let folder of folders[i].getFolders()) {
            yield folder;
        }
    }
}

/**
 * Delete all bookmarks.
 */
function deleteAllBookmarks() {
    let folders = getAllFolders();
    let id;
    for (let folder of folders) {
        while (folder.getChildren().length > 1 || folder.getChildren()[0].length > 0) {
            for (let i = 0; i <= folder.getChildren()[0].length; ++i) {
                id = bookmarkService.getIdForItemAt(folder.id, i);
                if (id > -1) {
                    bookmarkService.removeItem(id);
                }
            }
        }
    }

    sort(MENU);
    sort(TOOLBAR);
    sort(UNSORTED);
}

/**
 * Get the option long name from the `shortName`.
 * @param {string} The short name.
 * @return {string} The long name.
 */
function getOptionName(shortName) {
    return "extensions." + self.id + "." + shortName;
}

/**
 * Move `item` to `newIndex`.
 * @param {Item} item The item to move.
 * @param {int} newIndex The new item position.
 * @param {int} parent The new parent.
 */
function move(item, newIndex, parent) {
    if (parent !== undefined) {
        item.parentID = parent.id;
    }

    bookmarkService.moveItem(item.id, item.parentID, newIndex);
}

/**
 * Open an new window.
 */
function openWindow() {
    let deferred = defer();

    windows.open({
        onOpen: function () {
            deferred.resolve();
        },

        url: "",
    });

    return deferred.promise;
}

/**
 * Print the `folder` children.
 * @param {Folder} folder The folder to print.
 */
function printFolder(folder) {
    for (let bookmark of folder.getChildren()[0]) {
        console.log(bookmark.title);
    }
}

/**
 * Get an array of `count` numbers.
 * @param {int} count The new array length.
 * @return {Array.<int>} The new array of numbers.
 */
function range(count) {
    let array = [];
    for (let i = 0; i < count; ++i) {
        array.push(i);
    }

    return array;
}

/**
 * Rename `item` to `newName`.
 * @param {Item} item The item to rename.
 * @param {string} newName The new name.
 */
function rename(item, newName) {
    item.title = newName;
    bookmarkService.setItemTitle(item.id, newName);
}

/**
 * Reset the preferences to their default value.
 */
function resetPreferences() {
    let preferences = ["auto_sort", "delay", "folder_delay", "sort_menu", "sort_toolbar", "sort_unsorted", "sort_by", "inverse", "then_sort_by", "then_inverse", "folder_sort_order", "livemark_sort_order", "smart_bookmark_sort_order", "bookmark_sort_order", "show_tools_menu_item", "show_bookmarks_menu_item", "show_bookmarks_toolbar_menu_item", "show_bookmarks_manager_menu_item"];
    for (let preference of preferences) {
        reset(getOptionName(preference));
    }
}

/**
 * Set the `item` `dateAdded`.
 * @param {Item} item The item.
 * @param {int} dateAdded The new date added time.
 */
function setDateAdded(item, dateAdded) {
    bookmarkService.setItemDateAdded(item.id, dateAdded);
}

/**
 * Set the `item` `description`.
 * @param {Item} item The item.
 * @param {string} description The new description.
 */
function setDescription(item, description) {
    try {
        annotationService.setItemAnnotation(item.id, descriptionAnnotation, description, 0, Ci.nsIAnnotationService.EXPIRE_NEVER);
    }
    catch (exception) {
        console.log("Cannot set description on item " + item.id + ".");
    }
}

/**
 * Set the `item` `keyword`.
 * @param {Item} item The item.
 * @param {string} keyword The new keyword.
 */
function setKeyword(item, keyword) {
    return PlacesUtils.keywords.insert({
        keyword: keyword,
        url: item.url,
    });
}

/**
 * Set the `item` `lastModified`.
 * @param {Item} item The item.
 * @param {int} lastModified The new last modified time.
 */
function setLastModified(item, lastModified) {
    bookmarkService.setItemLastModified(item.id, lastModified);
}

/**
 * Set the `visits` the `item`.
 * @param {Item} item The item.
 * @param {Array.<int>|int} visits The visit times.
 */
function setVisits(item, visits) {
    let deferred = defer();

    if (visits.length === undefined) {
        visits = [visits];
    }

    for (let index in visits) {
        if (visits.hasOwnProperty(index)) {
            visits[index] = {
                referrerURI: undefined,
                transitionType: Ci.nsINavHistoryService.TRANSITION_LINK,
                visitDate: visits[index] * 1000,
            };
        }
    }

    asyncHistory.updatePlaces({
        title: item.title,
        uri: ioService.newURI(item.url, null, null),
        visits: visits,
    }, {
        handleCompletion: function () {
            deferred.resolve();
        },

        handleResult: function () {
        },
    });

    return deferred.promise;
}

function showBookmarksManager() {
    let deferred = defer();

    let window = windowUtils.getMostRecentWindow();
    let bookmarksManager = windowUtils.getMostRecentWindow("Places:Organizer");
    if (bookmarksManager === null) {
        bookmarksManager = window.openDialog("chrome://browser/content/places/places.xul", "", "chrome,toolbar=yes,dialog=no,resizable", "AllBookmarks");

        bookmarksManager.addEventListener("load", function () {
            deferred.resolve(bookmarksManager);
        }, false);
    }
    else {
        bookmarksManager.PlacesOrganizer.selectLeftPaneQuery("AllBookmarks");
        bookmarksManager.focus();

        deferred.resolve(bookmarksManager);
    }

    return deferred.promise;
}

exports.assertBookmarksArray = assertBookmarksArray;
exports.createBookmark = createBookmark;
exports.createFolder = createFolder;
exports.createLivemark = createLivemark;
exports.createSeparator = createSeparator;
exports.createSmartBookmark = createSmartBookmark;
exports.deleteAllBookmarks = deleteAllBookmarks;
exports.deleteItem = deleteItem;
exports.getOptionName = getOptionName;
exports.ignore = ignore;
exports.move = move;
exports.openWindow = openWindow;
exports.printFolder = printFolder;
exports.range = range;
exports.rename = rename;
exports.resetPreferences = resetPreferences;
exports.setDateAdded = setDateAdded;
exports.setDescription = setDescription;
exports.setKeyword = setKeyword;
exports.setLastModified = setLastModified;
exports.setVisits = setVisits;
exports.showBookmarksManager = showBookmarksManager;
exports.sort = sort;
