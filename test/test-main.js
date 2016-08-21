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

const {MENU, TOOLBAR, UNSORTED} = require("sdk/places/bookmarks");
const simplePrefs = require("sdk/simple-prefs");
const prefs = simplePrefs.prefs;
const {menuFolder, toolbarFolder, unsortedFolder} = require("lib/bookmarks");
const {adjustSortCriteria, createEvents, setPreferenceMinimumMaximum} = require("lib/main");
const {assertBookmarksArray, createBookmark, createFolder, createLivemark, createSeparator, createSmartBookmark, deleteAllBookmarks, deleteItem, ignore, move, rename, resetPreferences, setVisits, sort} = require("./utils");

exports.testAutoSort = function (assert) {
    adjustSortCriteria();
    createEvents();

    deleteAllBookmarks();

    let folder = createFolder("Folder", menuFolder);

    let bookmark1 = createBookmark("Title", "http://title.com/", folder);
    let bookmark2 = createBookmark("Test", "http://test.com/", folder);
    let bookmark3 = createBookmark("Abc", "http://abc.com/", folder);

    prefs.auto_sort = true;

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark2, bookmark1]);
    assert.strictEqual(folder.getChildren().length, 1);

    prefs.auto_sort = false;

    deleteAllBookmarks();

    folder = createFolder("Folder", menuFolder);

    bookmark1 = createBookmark("Title", "http://title.com/", folder);
    bookmark2 = createBookmark("Test", "http://test.com/", folder);
    bookmark3 = createBookmark("Abc", "http://abc.com/", folder);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2, bookmark3]);
    assert.strictEqual(folder.getChildren().length, 1);

    resetPreferences();
};

exports.testAutoSortOnChanges = function (assert) {
    adjustSortCriteria();
    createEvents();
    prefs.auto_sort = true;

    deleteAllBookmarks();

    // Test adding bookmarks.
    let folder = createFolder("Folder", menuFolder);

    let bookmark1 = createBookmark("Title21", "http://title21.com/", folder);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1]);
    assert.strictEqual(folder.getChildren().length, 1);

    let bookmark2 = createBookmark("Test22", "http://test22.com/", folder);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark2, bookmark1]);
    assert.strictEqual(folder.getChildren().length, 1);

    let bookmark3 = createBookmark("Abc23", "http://abc23.com/", folder);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark2, bookmark1]);
    assert.strictEqual(folder.getChildren().length, 1);

    // Test changing bookmarks.
    rename(bookmark3, "Zebra23");

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark2, bookmark1, bookmark3]);
    assert.strictEqual(folder.getChildren().length, 1);

    rename(bookmark2, "Title Test22");

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2, bookmark3]);
    assert.strictEqual(folder.getChildren().length, 1);

    // Test moving bookmarks.
    move(bookmark3, 0);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2, bookmark3]);
    assert.strictEqual(folder.getChildren().length, 1);

    move(bookmark1, 4);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2, bookmark3]);
    assert.strictEqual(folder.getChildren().length, 1);

    let bookmark4 = createBookmark("Abc24", "http://abc24.com/", menuFolder);

    move(bookmark4, 4, folder);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark1, bookmark2, bookmark3]);
    assert.strictEqual(folder.getChildren().length, 1);

    let separator3 = createSeparator(folder);
    let bookmark10 = createBookmark("Firefox30", "http://firefox30.com/", folder);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark1, bookmark2, bookmark3]);
    assertBookmarksArray(assert, folder.getChildren()[1], [bookmark10]);
    assert.strictEqual(folder.getChildren().length, 2);

    move(separator3, 3);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark1, bookmark2]);
    assertBookmarksArray(assert, folder.getChildren()[1], [bookmark10, bookmark3]);
    assert.strictEqual(folder.getChildren().length, 2);

    move(bookmark4, 2);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark1, bookmark2]);
    assertBookmarksArray(assert, folder.getChildren()[1], [bookmark10, bookmark3]);
    assert.strictEqual(folder.getChildren().length, 2);

    move(bookmark4, 7);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2]);
    assertBookmarksArray(assert, folder.getChildren()[1], [bookmark4, bookmark10, bookmark3]);
    assert.strictEqual(folder.getChildren().length, 2);

    move(bookmark10, 2);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark10, bookmark1, bookmark2]);
    assertBookmarksArray(assert, folder.getChildren()[1], [bookmark4, bookmark3]);
    assert.strictEqual(folder.getChildren().length, 2);

    let separator4 = createSeparator(folder);
    let bookmark11 = createBookmark("Mozilla31", "http://mozilla31.com/", folder);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark10, bookmark1, bookmark2]);
    assertBookmarksArray(assert, folder.getChildren()[1], [bookmark4, bookmark3]);
    assertBookmarksArray(assert, folder.getChildren()[2], [bookmark11]);
    assert.strictEqual(folder.getChildren().length, 3);

    move(bookmark10, 4);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2]);
    assertBookmarksArray(assert, folder.getChildren()[1], [bookmark4, bookmark10, bookmark3]);
    assertBookmarksArray(assert, folder.getChildren()[2], [bookmark11]);
    assert.strictEqual(folder.getChildren().length, 3);

    move(bookmark10, 9);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2]);
    assertBookmarksArray(assert, folder.getChildren()[1], [bookmark4, bookmark3]);
    assertBookmarksArray(assert, folder.getChildren()[2], [bookmark10, bookmark11]);
    assert.strictEqual(folder.getChildren().length, 3);

    move(separator4, 4);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2]);
    assertBookmarksArray(assert, folder.getChildren()[1], [bookmark4]);
    assertBookmarksArray(assert, folder.getChildren()[2], [bookmark10, bookmark11, bookmark3]);
    assert.strictEqual(folder.getChildren().length, 3);

    deleteItem(separator3);
    deleteItem(separator4);
    deleteItem(bookmark10);
    deleteItem(bookmark11);

    // Test deleting bookmarks.
    let separator1 = createSeparator(folder);
    let bookmark5 = createBookmark("One Test25", "http://one25.com/", folder);
    let bookmark6 = createBookmark("Two tests26", "http://two26.com/", folder);
    let separator2 = createSeparator(folder);
    let bookmark7 = createBookmark("Auie27", "http://auie27.com/", folder);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark1, bookmark2, bookmark3]);
    assertBookmarksArray(assert, folder.getChildren()[1], [bookmark5, bookmark6]);
    assertBookmarksArray(assert, folder.getChildren()[2], [bookmark7]);
    assert.strictEqual(folder.getChildren().length, 3);

    deleteItem(bookmark1);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark2, bookmark3]);
    assertBookmarksArray(assert, folder.getChildren()[1], [bookmark5, bookmark6]);
    assertBookmarksArray(assert, folder.getChildren()[2], [bookmark7]);
    assert.strictEqual(folder.getChildren().length, 3);

    deleteItem(separator2);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark2, bookmark3]);
    assertBookmarksArray(assert, folder.getChildren()[1], [bookmark7, bookmark5, bookmark6]);
    assert.strictEqual(folder.getChildren().length, 2);

    deleteItem(separator1);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark7, bookmark5, bookmark2, bookmark6, bookmark3]);
    assert.strictEqual(folder.getChildren().length, 1);

    // Test multiple changes.
    let folder2 = createFolder("Folder", toolbarFolder);
    let bookmark8 = createBookmark("Abc28", "http://abc28.com/", folder2);
    let bookmark9 = createBookmark("Test29", "http://test29.com/", folder2);

    assertBookmarksArray(assert, folder2.getChildren()[0], [bookmark8, bookmark9]);
    assert.strictEqual(folder2.getChildren().length, 1);

    rename(bookmark3, "Aiue23");
    rename(bookmark8, "Zeta29");

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark3, bookmark7, bookmark5, bookmark2, bookmark6]);
    assert.strictEqual(folder.getChildren().length, 1);

    assertBookmarksArray(assert, folder2.getChildren()[0], [bookmark9, bookmark8]);
    assert.strictEqual(folder2.getChildren().length, 1);

    rename(bookmark3, "Zebra23");

    // Test visiting bookmarks.
    prefs.sort_by = 7;
    prefs.then_sort_by = 0;

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark7, bookmark5, bookmark2, bookmark6, bookmark3]);
    assert.strictEqual(folder.getChildren().length, 1);

    setVisits(bookmark2, [10]);
    setVisits(bookmark3, [10]);
    setVisits(bookmark4, [100, 200, 300, 400]);
    setVisits(bookmark5, [10]);
    setVisits(bookmark6, [10]);
    setVisits(bookmark7, [10]);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark7, bookmark5, bookmark2, bookmark6, bookmark3, bookmark4]);
    assert.strictEqual(folder.getChildren().length, 1);

    resetPreferences();
};

exports.testAutoSortOnOptionChanges = function (assert) {
    adjustSortCriteria();
    createEvents();

    // Sort Menu Folder.
    deleteAllBookmarks();

    let folder = createFolder("Folder", menuFolder);

    let bookmark1 = createBookmark("Title", "http://title.com/", folder);
    let bookmark2 = createBookmark("Test", "http://test.com/", folder);
    let bookmark3 = createBookmark("Abc", "http://abc.com/", folder);

    ignore(MENU);
    prefs.auto_sort = true;

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2, bookmark3]);
    assert.strictEqual(folder.getChildren().length, 1);

    sort(MENU);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark2, bookmark1]);
    assert.strictEqual(folder.getChildren().length, 1);

    prefs.auto_sort = false;

    // Sort Toolbar Folder.
    deleteAllBookmarks();

    folder = createFolder("Folder", toolbarFolder);

    bookmark1 = createBookmark("Title", "http://title.com/", folder);
    bookmark2 = createBookmark("Test", "http://test.com/", folder);
    bookmark3 = createBookmark("Abc", "http://abc.com/", folder);

    ignore(TOOLBAR);
    prefs.auto_sort = true;

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2, bookmark3]);
    assert.strictEqual(folder.getChildren().length, 1);

    sort(TOOLBAR);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark2, bookmark1]);
    assert.strictEqual(folder.getChildren().length, 1);

    prefs.auto_sort = false;

    // Sort Unsorted Folder.
    deleteAllBookmarks();

    folder = createFolder("Folder", unsortedFolder);

    bookmark1 = createBookmark("Title", "http://title.com/", folder);
    bookmark2 = createBookmark("Test", "http://test.com/", folder);
    bookmark3 = createBookmark("Abc", "http://abc.com/", folder);

    ignore(UNSORTED);
    prefs.auto_sort = true;

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2, bookmark3]);
    assert.strictEqual(folder.getChildren().length, 1);

    sort(UNSORTED);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark2, bookmark1]);
    assert.strictEqual(folder.getChildren().length, 1);

    prefs.auto_sort = false;

    // Sort Order.
    deleteAllBookmarks();

    folder = createFolder("Folder", menuFolder);

    let folder1 = createFolder("Folder 1", folder);
    let livemark1 = createLivemark("Livemark", "http://www.mozilla.org/", folder);
    let smartBookmark1 = createSmartBookmark("Smart Bookmark", "MostVisited", "place:sort=8&maxResults=10", folder);
    bookmark1 = createBookmark("Bookmark", "http://title.com/", folder);

    prefs.folder_sort_order = 1;
    prefs.livemark_sort_order = 2;
    prefs.smart_bookmark_sort_order = 3;
    prefs.bookmark_sort_order = 4;
    prefs.auto_sort = true;

    assertBookmarksArray(assert, folder.getChildren()[0], [folder1, livemark1, smartBookmark1, bookmark1]);
    assert.strictEqual(folder.getChildren().length, 1);

    prefs.bookmark_sort_order = 1;

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, folder1, livemark1, smartBookmark1]);
    assert.strictEqual(folder.getChildren().length, 1);

    prefs.smart_bookmark_sort_order = 1;

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, folder1, smartBookmark1, livemark1]);
    assert.strictEqual(folder.getChildren().length, 1);

    prefs.folder_sort_order = 4;

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, smartBookmark1, livemark1, folder1]);
    assert.strictEqual(folder.getChildren().length, 1);

    prefs.livemark_sort_order = 1;

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, livemark1, smartBookmark1, folder1]);
    assert.strictEqual(folder.getChildren().length, 1);

    prefs.folder_sort_order = 1;

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, folder1, livemark1, smartBookmark1]);
    assert.strictEqual(folder.getChildren().length, 1);

    // Sort criteria.
    deleteAllBookmarks();

    folder = createFolder("Folder", toolbarFolder);

    bookmark1 = createBookmark("Test", "http://1test.com/", folder);
    bookmark2 = createBookmark("Test", "http://2test.com/", folder);
    bookmark3 = createBookmark("Abc", "http://3abc.com/", folder);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark1, bookmark2]);
    assert.strictEqual(folder.getChildren().length, 1);

    prefs.sort_by = 1;

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2, bookmark3]);
    assert.strictEqual(folder.getChildren().length, 1);

    prefs.sort_by = 0;
    prefs.inverse = true;
    prefs.then_inverse = true;

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2, bookmark3]);
    assert.strictEqual(folder.getChildren().length, 1);

    prefs.then_sort_by = 1;

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark2, bookmark1, bookmark3]);
    assert.strictEqual(folder.getChildren().length, 1);

    prefs.inverse = false;

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark2, bookmark1]);
    assert.strictEqual(folder.getChildren().length, 1);

    prefs.then_inverse = false;

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark1, bookmark2]);
    assert.strictEqual(folder.getChildren().length, 1);

    resetPreferences();
};

exports.testAutoSortDelay = function (assert) {
    adjustSortCriteria();
    createEvents();

    prefs.delay = 1;
    prefs.folder_delay = 3;
    prefs.auto_sort = true;

    deleteAllBookmarks();

    let folder = createFolder("Folder", menuFolder);

    let bookmark1 = createBookmark("Title", "http://title.com/", folder);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1]);
    assert.strictEqual(folder.getChildren().length, 1);

    let bookmark2 = createBookmark("Test", "http://test.com/", folder);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark2, bookmark1]);
    assert.strictEqual(folder.getChildren().length, 1);

    let bookmark3 = createBookmark("Abc", "http://abc.com/", folder);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark2, bookmark1]);
    assert.strictEqual(folder.getChildren().length, 1);

    let folder1 = createFolder("Folder1", folder);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark2, bookmark1, folder1]);
    assert.strictEqual(folder.getChildren().length, 1);

    assertBookmarksArray(assert, folder.getChildren()[0], [folder1, bookmark3, bookmark2, bookmark1]);
    assert.strictEqual(folder.getChildren().length, 1);

    prefs.auto_sort = false;
    prefs.delay = 0;
    prefs.folder_delay = 30;

    deleteAllBookmarks();

    folder = createFolder("Folder", menuFolder);

    bookmark1 = createBookmark("Title", "http://title.com/", folder);
    bookmark2 = createBookmark("Test", "http://test.com/", folder);
    bookmark3 = createBookmark("Abc", "http://abc.com/", folder);

    assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2, bookmark3]);
    assert.strictEqual(folder.getChildren().length, 1);

    resetPreferences();
};

exports.testPreferenceMaximumMinimum = function (assert) {
    setPreferenceMinimumMaximum();

    prefs.folder_sort_order = 0;
    assert.strictEqual(prefs.folder_sort_order, 1);

    prefs.folder_sort_order = 5;
    assert.strictEqual(prefs.folder_sort_order, 4);

    prefs.livemark_sort_order = 0;
    assert.strictEqual(prefs.livemark_sort_order, 1);

    prefs.livemark_sort_order = 5;
    assert.strictEqual(prefs.livemark_sort_order, 4);

    prefs.smart_bookmark_sort_order = 0;
    assert.strictEqual(prefs.smart_bookmark_sort_order, 1);

    prefs.smart_bookmark_sort_order = 5;
    assert.strictEqual(prefs.smart_bookmark_sort_order, 4);

    prefs.bookmark_sort_order = 0;
    assert.strictEqual(prefs.bookmark_sort_order, 1);

    prefs.bookmark_sort_order = 5;
    assert.strictEqual(prefs.bookmark_sort_order, 4);

    prefs.folder_delay = 2;
    assert.strictEqual(prefs.folder_delay, 3);

    resetPreferences();
};

require("sdk/test").run(exports);
