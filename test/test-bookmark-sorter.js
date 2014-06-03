/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, unused:true, curly:true, moz:true, indent:4, maxerr:50, globalstrict: true */
/*global require: false, exports: false */

/*
 * Copyright (C) 2014  Boucher, Antoni <bouanto@gmail.com>
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

'use strict';

const simplePrefs = require('sdk/simple-prefs'),
    prefs = simplePrefs.prefs,
    { menuFolder, toolbarFolder, unsortedFolder } = require('bookmarks'),
    { BookmarkSorter } = require('bookmark-sorter'),
    { sleep, spawn } = require('./task'),
    { assertBookmarksArray, createBookmark, createFolder, createLivemark, createSeparator, createSmartBookmark, deleteAllBookmarks, range, resetPreferences, printFolder, setDateAdded, setDescription, setKeyword, setLastModified, setVisits } = require('./utils'),
    SECOND = 1000;

exports.testGetAllFolders = function(assert) {
    deleteAllBookmarks();
    
    let bookmarkSorter = new BookmarkSorter();
    
    assertBookmarksArray(assert, bookmarkSorter.getAllFolders(), [menuFolder, toolbarFolder, unsortedFolder]);
    
    let bookmark = createBookmark('Title', 'http://example.url/', menuFolder);
    assertBookmarksArray(assert, bookmarkSorter.getAllFolders(), [menuFolder, toolbarFolder, unsortedFolder]);
    
    let livemark = createLivemark('Stack Overflow', 'http://stackoverflow.com/feeds', menuFolder);
    assertBookmarksArray(assert, bookmarkSorter.getAllFolders(), [menuFolder, toolbarFolder, unsortedFolder]);
    
    let smartBookmark = createSmartBookmark('Test Smart Bookmark', 'MostVisited', 'place:sort=8&maxResults=10', menuFolder);
    assertBookmarksArray(assert, bookmarkSorter.getAllFolders(), [menuFolder, toolbarFolder, unsortedFolder]);
    
    let folder = createFolder('Folder', menuFolder);
    assertBookmarksArray(assert, bookmarkSorter.getAllFolders(), [menuFolder, toolbarFolder, unsortedFolder, folder]);
    
    let secondFolder = createFolder('Second Folder', menuFolder);
    assertBookmarksArray(assert, bookmarkSorter.getAllFolders(), [menuFolder, toolbarFolder, unsortedFolder, folder, secondFolder]);
    
    let thirdFolder = createFolder('Second Folder', secondFolder);
    assertBookmarksArray(assert, bookmarkSorter.getAllFolders(), [menuFolder, toolbarFolder, unsortedFolder, folder, secondFolder, thirdFolder]);
    
    let fourthFolder = createFolder('Second Folder', thirdFolder);
    assertBookmarksArray(assert, bookmarkSorter.getAllFolders(), [menuFolder, toolbarFolder, unsortedFolder, folder, secondFolder, thirdFolder, fourthFolder]);
    
    let fifthFolder = createFolder('Second Folder', toolbarFolder);
    assertBookmarksArray(assert, bookmarkSorter.getAllFolders(), [menuFolder, toolbarFolder, unsortedFolder, folder, secondFolder, thirdFolder, fourthFolder, fifthFolder]);
    
    let sixthFolder = createFolder('Second Folder', unsortedFolder);
    assertBookmarksArray(assert, bookmarkSorter.getAllFolders(), [menuFolder, toolbarFolder, unsortedFolder, folder, secondFolder, thirdFolder, fourthFolder, fifthFolder, sixthFolder]);
    
    resetPreferences();
};

/**
 * Create sample bookmarks.
 * @return {object.<Item>} The new bookmarks.
 */
function createSampleBookmarks() {
    let bookmark1 = createBookmark('Title', 'http://title.com/', menuFolder);
    let bookmark2 = createBookmark('Test', 'http://test.com/', menuFolder);
    let bookmark3 = createBookmark('Abc', 'http://abc.com/', menuFolder);
    
    let bookmark4 = createBookmark('Title', 'http://title.com/', toolbarFolder);
    let bookmark5 = createBookmark('Test', 'http://test.com/', toolbarFolder);
    let bookmark6 = createBookmark('Abc', 'http://abc.com/', toolbarFolder);
    
    let bookmark7 = createBookmark('Title', 'http://title.com/', unsortedFolder);
    let bookmark8 = createBookmark('Test', 'http://test.com/', unsortedFolder);
    let bookmark9 = createBookmark('Abc', 'http://abc.com/', unsortedFolder);
    
    let folder1 = createFolder('Folder', menuFolder);
    
    let bookmark10 = createBookmark('Title', 'http://title.com/', folder1);
    let bookmark11 = createBookmark('Test', 'http://test.com/', folder1);
    let bookmark12 = createBookmark('Abc', 'http://abc.com/', folder1);
    let folder2 = createFolder('Folder', folder1);
    
    let bookmark13 = createBookmark('Title', 'http://title.com/', folder2);
    let bookmark14 = createBookmark('Test', 'http://test.com/', folder2);
    let bookmark15 = createBookmark('Abc', 'http://abc.com/', folder2);
    
    let folder3 = createFolder('Folder', toolbarFolder);
    
    let bookmark16 = createBookmark('Title', 'http://title.com/', folder3);
    let bookmark17 = createBookmark('Test', 'http://test.com/', folder3);
    let bookmark18 = createBookmark('Abc', 'http://abc.com/', folder3);
    let folder4 = createFolder('Folder', folder3);
    
    let bookmark19 = createBookmark('Title', 'http://title.com/', folder4);
    let bookmark20 = createBookmark('Test', 'http://test.com/', folder4);
    let bookmark21 = createBookmark('Abc', 'http://abc.com/', folder4);
    
    let folder5 = createFolder('Folder', unsortedFolder);
    
    let bookmark22 = createBookmark('Title', 'http://title.com/', folder5);
    let bookmark23 = createBookmark('Test', 'http://test.com/', folder5);
    let bookmark24 = createBookmark('Abc', 'http://abc.com/', folder5);
    let folder6 = createFolder('Folder', folder5);
    
    let bookmark25 = createBookmark('Title', 'http://title.com/', folder6);
    let bookmark26 = createBookmark('Test', 'http://test.com/', folder6);
    let bookmark27 = createBookmark('Abc', 'http://abc.com/', folder6);
    
    return {
        bookmark1: bookmark1,
        bookmark2: bookmark2,
        bookmark3: bookmark3,
        bookmark4: bookmark4,
        bookmark5: bookmark5,
        bookmark6: bookmark6,
        bookmark7: bookmark7,
        bookmark8: bookmark8,
        bookmark9: bookmark9,
        bookmark10: bookmark10,
        bookmark11: bookmark11,
        bookmark12: bookmark12,
        bookmark13: bookmark13,
        bookmark14: bookmark14,
        bookmark15: bookmark15,
        bookmark16: bookmark16,
        bookmark17: bookmark17,
        bookmark18: bookmark18,
        bookmark19: bookmark19,
        bookmark20: bookmark20,
        bookmark21: bookmark21,
        bookmark22: bookmark22,
        bookmark23: bookmark23,
        bookmark24: bookmark24,
        bookmark25: bookmark25,
        bookmark26: bookmark26,
        bookmark27: bookmark27,
        folder1: folder1,
        folder2: folder2,
        folder3: folder3,
        folder4: folder4,
        folder5: folder5,
        folder6: folder6
    };
}

exports.testNotSortedFolders = function(assert, done) {
    spawn(function() {
        
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('title', false, undefined, false);
        
        let bookmarks = createSampleBookmarks();
        
        prefs.sort_menu = false;
        prefs.sort_toolbar = true;
        prefs.sort_unsorted = true;
        
        yield bookmarkSorter.sortAllBookmarks();
        
        assertBookmarksArray(assert, menuFolder.getChildren()[0], [bookmarks.bookmark1, bookmarks.bookmark2, bookmarks.bookmark3, bookmarks.folder1]);
        assert.strictEqual(menuFolder.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder1.getChildren()[0], [bookmarks.bookmark10, bookmarks.bookmark11, bookmarks.bookmark12, bookmarks.folder2]);
        assert.strictEqual(bookmarks.folder1.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder2.getChildren()[0], [bookmarks.bookmark13, bookmarks.bookmark14, bookmarks.bookmark15]);
        assert.strictEqual(bookmarks.folder2.getChildren().length, 1);
        
        assertBookmarksArray(assert, toolbarFolder.getChildren()[0], [bookmarks.folder3, bookmarks.bookmark6, bookmarks.bookmark5, bookmarks.bookmark4]);
        assert.strictEqual(toolbarFolder.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder3.getChildren()[0], [bookmarks.folder4, bookmarks.bookmark18, bookmarks.bookmark17, bookmarks.bookmark16]);
        assert.strictEqual(bookmarks.folder3.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder4.getChildren()[0], [bookmarks.bookmark21, bookmarks.bookmark20, bookmarks.bookmark19]);
        assert.strictEqual(bookmarks.folder4.getChildren().length, 1);
        
        assertBookmarksArray(assert, unsortedFolder.getChildren()[0], [bookmarks.folder5, bookmarks.bookmark9, bookmarks.bookmark8, bookmarks.bookmark7]);
        assert.strictEqual(unsortedFolder.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder5.getChildren()[0], [bookmarks.folder6, bookmarks.bookmark24, bookmarks.bookmark23, bookmarks.bookmark22]);
        assert.strictEqual(bookmarks.folder5.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder6.getChildren()[0], [bookmarks.bookmark27, bookmarks.bookmark26, bookmarks.bookmark25]);
        assert.strictEqual(bookmarks.folder6.getChildren().length, 1);
        
        deleteAllBookmarks();
        
        bookmarks = createSampleBookmarks();
        
        prefs.sort_menu = true;
        prefs.sort_toolbar = false;
        prefs.sort_unsorted = true;
        
        yield bookmarkSorter.sortAllBookmarks();
        
        assertBookmarksArray(assert, menuFolder.getChildren()[0], [bookmarks.folder1, bookmarks.bookmark3, bookmarks.bookmark2, bookmarks.bookmark1]);
        assert.strictEqual(menuFolder.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder1.getChildren()[0], [bookmarks.folder2, bookmarks.bookmark12, bookmarks.bookmark11, bookmarks.bookmark10]);
        assert.strictEqual(bookmarks.folder1.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder2.getChildren()[0], [bookmarks.bookmark15, bookmarks.bookmark14, bookmarks.bookmark13]);
        assert.strictEqual(bookmarks.folder2.getChildren().length, 1);
        
        assertBookmarksArray(assert, toolbarFolder.getChildren()[0], [bookmarks.bookmark4, bookmarks.bookmark5, bookmarks.bookmark6, bookmarks.folder3]);
        assert.strictEqual(toolbarFolder.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder3.getChildren()[0], [bookmarks.bookmark16, bookmarks.bookmark17, bookmarks.bookmark18, bookmarks.folder4]);
        assert.strictEqual(bookmarks.folder3.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder4.getChildren()[0], [bookmarks.bookmark19, bookmarks.bookmark20, bookmarks.bookmark21]);
        assert.strictEqual(bookmarks.folder4.getChildren().length, 1);
        
        assertBookmarksArray(assert, unsortedFolder.getChildren()[0], [bookmarks.folder5, bookmarks.bookmark9, bookmarks.bookmark8, bookmarks.bookmark7]);
        assert.strictEqual(unsortedFolder.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder5.getChildren()[0], [bookmarks.folder6, bookmarks.bookmark24, bookmarks.bookmark23, bookmarks.bookmark22]);
        assert.strictEqual(bookmarks.folder5.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder6.getChildren()[0], [bookmarks.bookmark27, bookmarks.bookmark26, bookmarks.bookmark25]);
        assert.strictEqual(bookmarks.folder6.getChildren().length, 1);
        
        deleteAllBookmarks();
        
        bookmarks = createSampleBookmarks();
        
        prefs.sort_menu = true;
        prefs.sort_toolbar = true;
        prefs.sort_unsorted = false;
        
        yield bookmarkSorter.sortAllBookmarks();
        
        assertBookmarksArray(assert, menuFolder.getChildren()[0], [bookmarks.folder1, bookmarks.bookmark3, bookmarks.bookmark2, bookmarks.bookmark1]);
        assert.strictEqual(menuFolder.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder1.getChildren()[0], [bookmarks.folder2, bookmarks.bookmark12, bookmarks.bookmark11, bookmarks.bookmark10]);
        assert.strictEqual(bookmarks.folder1.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder2.getChildren()[0], [bookmarks.bookmark15, bookmarks.bookmark14, bookmarks.bookmark13]);
        assert.strictEqual(bookmarks.folder2.getChildren().length, 1);
        
        assertBookmarksArray(assert, toolbarFolder.getChildren()[0], [bookmarks.folder3, bookmarks.bookmark6, bookmarks.bookmark5, bookmarks.bookmark4]);
        assert.strictEqual(toolbarFolder.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder3.getChildren()[0], [bookmarks.folder4, bookmarks.bookmark18, bookmarks.bookmark17, bookmarks.bookmark16]);
        assert.strictEqual(bookmarks.folder3.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder4.getChildren()[0], [bookmarks.bookmark21, bookmarks.bookmark20, bookmarks.bookmark19]);
        assert.strictEqual(bookmarks.folder4.getChildren().length, 1);
        
        assertBookmarksArray(assert, unsortedFolder.getChildren()[0], [bookmarks.bookmark7, bookmarks.bookmark8, bookmarks.bookmark9, bookmarks.folder5]);
        assert.strictEqual(unsortedFolder.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder5.getChildren()[0], [bookmarks.bookmark22, bookmarks.bookmark23, bookmarks.bookmark24, bookmarks.folder6]);
        assert.strictEqual(bookmarks.folder5.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder6.getChildren()[0], [bookmarks.bookmark25, bookmarks.bookmark26, bookmarks.bookmark27]);
        assert.strictEqual(bookmarks.folder6.getChildren().length, 1);
        
        deleteAllBookmarks();
        
        bookmarks = createSampleBookmarks();
        
        prefs.sort_menu = false;
        prefs.sort_toolbar = false;
        prefs.sort_unsorted = true;
        
        yield bookmarkSorter.sortAllBookmarks();
        
        assertBookmarksArray(assert, menuFolder.getChildren()[0], [bookmarks.bookmark1, bookmarks.bookmark2, bookmarks.bookmark3, bookmarks.folder1]);
        assert.strictEqual(menuFolder.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder1.getChildren()[0], [bookmarks.bookmark10, bookmarks.bookmark11, bookmarks.bookmark12, bookmarks.folder2]);
        assert.strictEqual(bookmarks.folder1.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder2.getChildren()[0], [bookmarks.bookmark13, bookmarks.bookmark14, bookmarks.bookmark15]);
        assert.strictEqual(bookmarks.folder2.getChildren().length, 1);
        
        assertBookmarksArray(assert, toolbarFolder.getChildren()[0], [bookmarks.bookmark4, bookmarks.bookmark5, bookmarks.bookmark6, bookmarks.folder3]);
        assert.strictEqual(toolbarFolder.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder3.getChildren()[0], [bookmarks.bookmark16, bookmarks.bookmark17, bookmarks.bookmark18, bookmarks.folder4]);
        assert.strictEqual(bookmarks.folder3.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder4.getChildren()[0], [bookmarks.bookmark19, bookmarks.bookmark20, bookmarks.bookmark21]);
        assert.strictEqual(bookmarks.folder4.getChildren().length, 1);
        
        assertBookmarksArray(assert, unsortedFolder.getChildren()[0], [bookmarks.folder5, bookmarks.bookmark9, bookmarks.bookmark8, bookmarks.bookmark7]);
        assert.strictEqual(unsortedFolder.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder5.getChildren()[0], [bookmarks.folder6, bookmarks.bookmark24, bookmarks.bookmark23, bookmarks.bookmark22]);
        assert.strictEqual(bookmarks.folder5.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder6.getChildren()[0], [bookmarks.bookmark27, bookmarks.bookmark26, bookmarks.bookmark25]);
        assert.strictEqual(bookmarks.folder6.getChildren().length, 1);
        
        deleteAllBookmarks();
        
        bookmarks = createSampleBookmarks();
        
        prefs.sort_menu = true;
        prefs.sort_toolbar = false;
        prefs.sort_unsorted = false;
        
        yield bookmarkSorter.sortAllBookmarks();
        
        assertBookmarksArray(assert, menuFolder.getChildren()[0], [bookmarks.folder1, bookmarks.bookmark3, bookmarks.bookmark2, bookmarks.bookmark1]);
        assert.strictEqual(menuFolder.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder1.getChildren()[0], [bookmarks.folder2, bookmarks.bookmark12, bookmarks.bookmark11, bookmarks.bookmark10]);
        assert.strictEqual(bookmarks.folder1.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder2.getChildren()[0], [bookmarks.bookmark15, bookmarks.bookmark14, bookmarks.bookmark13]);
        assert.strictEqual(bookmarks.folder2.getChildren().length, 1);
        
        assertBookmarksArray(assert, toolbarFolder.getChildren()[0], [bookmarks.bookmark4, bookmarks.bookmark5, bookmarks.bookmark6, bookmarks.folder3]);
        assert.strictEqual(toolbarFolder.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder3.getChildren()[0], [bookmarks.bookmark16, bookmarks.bookmark17, bookmarks.bookmark18, bookmarks.folder4]);
        assert.strictEqual(bookmarks.folder3.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder4.getChildren()[0], [bookmarks.bookmark19, bookmarks.bookmark20, bookmarks.bookmark21]);
        assert.strictEqual(bookmarks.folder4.getChildren().length, 1);
        
        assertBookmarksArray(assert, unsortedFolder.getChildren()[0], [bookmarks.bookmark7, bookmarks.bookmark8, bookmarks.bookmark9, bookmarks.folder5]);
        assert.strictEqual(unsortedFolder.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder5.getChildren()[0], [bookmarks.bookmark22, bookmarks.bookmark23, bookmarks.bookmark24, bookmarks.folder6]);
        assert.strictEqual(bookmarks.folder5.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder6.getChildren()[0], [bookmarks.bookmark25, bookmarks.bookmark26, bookmarks.bookmark27]);
        assert.strictEqual(bookmarks.folder6.getChildren().length, 1);
        
        deleteAllBookmarks();
        
        bookmarks = createSampleBookmarks();
        
        prefs.sort_menu = false;
        prefs.sort_toolbar = false;
        prefs.sort_unsorted = false;
        
        yield bookmarkSorter.sortAllBookmarks();
        
        assertBookmarksArray(assert, menuFolder.getChildren()[0], [bookmarks.bookmark1, bookmarks.bookmark2, bookmarks.bookmark3, bookmarks.folder1]);
        assert.strictEqual(menuFolder.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder1.getChildren()[0], [bookmarks.bookmark10, bookmarks.bookmark11, bookmarks.bookmark12, bookmarks.folder2]);
        assert.strictEqual(bookmarks.folder1.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder2.getChildren()[0], [bookmarks.bookmark13, bookmarks.bookmark14, bookmarks.bookmark15]);
        assert.strictEqual(bookmarks.folder2.getChildren().length, 1);
        
        assertBookmarksArray(assert, toolbarFolder.getChildren()[0], [bookmarks.bookmark4, bookmarks.bookmark5, bookmarks.bookmark6, bookmarks.folder3]);
        assert.strictEqual(toolbarFolder.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder3.getChildren()[0], [bookmarks.bookmark16, bookmarks.bookmark17, bookmarks.bookmark18, bookmarks.folder4]);
        assert.strictEqual(bookmarks.folder3.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder4.getChildren()[0], [bookmarks.bookmark19, bookmarks.bookmark20, bookmarks.bookmark21]);
        assert.strictEqual(bookmarks.folder4.getChildren().length, 1);
        
        assertBookmarksArray(assert, unsortedFolder.getChildren()[0], [bookmarks.bookmark7, bookmarks.bookmark8, bookmarks.bookmark9, bookmarks.folder5]);
        assert.strictEqual(unsortedFolder.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder5.getChildren()[0], [bookmarks.bookmark22, bookmarks.bookmark23, bookmarks.bookmark24, bookmarks.folder6]);
        assert.strictEqual(bookmarks.folder5.getChildren().length, 1);
        assertBookmarksArray(assert, bookmarks.folder6.getChildren()[0], [bookmarks.bookmark25, bookmarks.bookmark26, bookmarks.bookmark27]);
        assert.strictEqual(bookmarks.folder6.getChildren().length, 1);
        
        resetPreferences();
        
        done();
    });
};

exports.testSeparator = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('title', false, undefined, false);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Title', 'http://title.com/', folder);
        let bookmark2 = createBookmark('Test', 'http://test.com/', folder);
        let bookmark3 = createBookmark('Abc', 'http://abc.com/', folder);
        createSeparator(folder);
        let bookmark4 = createBookmark('Nice test', 'http://nice.com/', folder);
        let bookmark5 = createBookmark('Nice example', 'http://example.com/', folder);
        createSeparator(folder);
        let bookmark6 = createBookmark('Testing', 'http://testing.com/', folder);
        let bookmark7 = createBookmark('Nice test', 'http://nice.com/', folder);
        createSeparator(folder);
        let bookmark8 = createBookmark('Test', 'http://test.com/', folder);
        let bookmark9 = createBookmark('Abc', 'http://abc.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark2, bookmark1]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark5, bookmark4]);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark7, bookmark6]);
        assertBookmarksArray(assert, folder.getChildren()[3], [bookmark9, bookmark8]);
        assert.strictEqual(folder.getChildren().length, 4);
        
        deleteAllBookmarks();
        
        folder = createFolder('Folder', menuFolder);
        
        bookmark1 = createBookmark('Title', 'http://title.com/', folder);
        bookmark2 = createBookmark('Test', 'http://test.com/', folder);
        bookmark3 = createBookmark('Abc', 'http://abc.com/', folder);
        createSeparator(folder);
        createSeparator(folder);
        bookmark4 = createBookmark('Nice test', 'http://nice.com/', folder);
        bookmark5 = createBookmark('Nice example', 'http://example.com/', folder);
        createSeparator(folder);
        createSeparator(folder);
        createSeparator(folder);
        bookmark6 = createBookmark('Testing', 'http://testing.com/', folder);
        bookmark7 = createBookmark('Nice test', 'http://nice.com/', folder);
        createSeparator(folder);
        bookmark8 = createBookmark('Test', 'http://test.com/', folder);
        bookmark9 = createBookmark('Abc', 'http://abc.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark2, bookmark1]);
        assert.strictEqual(folder.getChildren()[1].length, 0);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark5, bookmark4]);
        assert.strictEqual(folder.getChildren()[3].length, 0);
        assert.strictEqual(folder.getChildren()[4].length, 0);
        assertBookmarksArray(assert, folder.getChildren()[5], [bookmark7, bookmark6]);
        assertBookmarksArray(assert, folder.getChildren()[6], [bookmark9, bookmark8]);
        assert.strictEqual(folder.getChildren().length, 7);
        
        deleteAllBookmarks();
        
        folder = createFolder('Folder', menuFolder);
        
        createSeparator(folder);
        bookmark1 = createBookmark('Title', 'http://title.com/', folder);
        bookmark2 = createBookmark('Test', 'http://test.com/', folder);
        bookmark3 = createBookmark('Abc', 'http://abc.com/', folder);
        createSeparator(folder);
        bookmark4 = createBookmark('Nice test', 'http://nice.com/', folder);
        bookmark5 = createBookmark('Nice example', 'http://example.com/', folder);
        createSeparator(folder);
        createSeparator(folder);
        bookmark6 = createBookmark('Testing', 'http://testing.com/', folder);
        bookmark7 = createBookmark('Nice test', 'http://nice.com/', folder);
        createSeparator(folder);
        bookmark8 = createBookmark('Test', 'http://test.com/', folder);
        bookmark9 = createBookmark('Abc', 'http://abc.com/', folder);
        createSeparator(folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assert.strictEqual(folder.getChildren()[0].length, 0);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark3, bookmark2, bookmark1]);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark5, bookmark4]);
        assert.strictEqual(folder.getChildren()[3].length, 0);
        assertBookmarksArray(assert, folder.getChildren()[4], [bookmark7, bookmark6]);
        assertBookmarksArray(assert, folder.getChildren()[5], [bookmark9, bookmark8]);
        assert.strictEqual(folder.getChildren()[6].length, 0);
        assert.strictEqual(folder.getChildren().length, 7);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortAll = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('title', false, undefined, false);
        
        let bookmark1 = createBookmark('Title', 'http://title.com/', menuFolder);
        let bookmark2 = createBookmark('Test', 'http://test.com/', menuFolder);
        let bookmark3 = createBookmark('Abc', 'http://abc.com/', menuFolder);
        
        let bookmark4 = createBookmark('Title', 'http://title.com/', toolbarFolder);
        let bookmark5 = createBookmark('Test', 'http://test.com/', toolbarFolder);
        let bookmark6 = createBookmark('Abc', 'http://abc.com/', toolbarFolder);
        
        let bookmark7 = createBookmark('Title', 'http://title.com/', unsortedFolder);
        let bookmark8 = createBookmark('Test', 'http://test.com/', unsortedFolder);
        let bookmark9 = createBookmark('Abc', 'http://abc.com/', unsortedFolder);
        
        yield bookmarkSorter.sortAllBookmarks();
        
        assertBookmarksArray(assert, menuFolder.getChildren()[0], [bookmark3, bookmark2, bookmark1]);
        assert.strictEqual(menuFolder.getChildren().length, 1);
        assertBookmarksArray(assert, toolbarFolder.getChildren()[0], [bookmark6, bookmark5, bookmark4]);
        assert.strictEqual(toolbarFolder.getChildren().length, 1);
        assertBookmarksArray(assert, unsortedFolder.getChildren()[0], [bookmark9, bookmark8, bookmark7]);
        assert.strictEqual(unsortedFolder.getChildren().length, 1);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortCaseInsensitive = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('title', false, undefined, false);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Title', 'http://title.com/', folder);
        let bookmark2 = createBookmark('title', 'http://test.com/', folder);
        let bookmark3 = createBookmark('TiTlE', 'http://abc.com/', folder);
        let bookmark4 = createBookmark('Abc', 'http://abc.com/', folder);
        let bookmark5 = createBookmark('abc', 'http://abc.com/', folder);
        let bookmark6 = createBookmark('Xyz', 'http://xyz.com/', folder);
        let bookmark7 = createBookmark('xyz', 'http://xyz.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark5, bookmark3, bookmark1, bookmark2, bookmark6, bookmark7]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark8 = createBookmark('TITLE', 'http://nice.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark5, bookmark8, bookmark3, bookmark1, bookmark2, bookmark6, bookmark7]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark9 = createBookmark('TItle', 'http://example.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark5, bookmark8, bookmark9, bookmark3, bookmark1, bookmark2, bookmark6, bookmark7]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortDelay = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('title', false, undefined, false);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Title', 'http://title.com/', folder);
        let bookmark2 = createBookmark('Test', 'http://test.com/', folder);
        let bookmark3 = createBookmark('Abc', 'http://abc.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark2, bookmark1]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        deleteAllBookmarks();
        
        folder = createFolder('Folder', menuFolder);
        
        bookmark1 = createBookmark('Title', 'http://title.com/', folder);
        bookmark2 = createBookmark('Test', 'http://test.com/', folder);
        bookmark3 = createBookmark('Abc', 'http://abc.com/', folder);
        
        bookmarkSorter.sortFolders(folder, 200);
        
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        yield sleep(100);
        
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        yield sleep(200);
        
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark2, bookmark1]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        resetPreferences();
        
        done();
    });
};

/**
 * Create sample bookmarks.
 * @return {object} The bookmarks.
 */
function createSampleItems() {
    let folder = createFolder('Folder', menuFolder);
    
    let folder1 = createFolder('First Folder', folder);
    let folder2 = createFolder('Folder', folder);
    let bookmark1 = createBookmark('Title', 'http://title.com/', folder);
    let bookmark2 = createBookmark('Auie', 'http://auie.com/', folder);
    let bookmark3 = createBookmark('Zebra', 'http://zebra.com/', folder);
    let livemark1 = createLivemark('Test', 'http://test.com/', folder);
    let livemark2 = createLivemark('Addon', 'http://addon.com/', folder);
    let smartBookmark1 = createSmartBookmark('Test Smart Bookmark', 'MostVisited', 'place:sort=8&maxResults=10', folder);
    let smartBookmark2 = createSmartBookmark('Smart Bookmark', 'MostVisited', 'place:sort=8&maxResults=10', folder);
    
    return {
        folder: folder,
        folder1: folder1,
        folder2: folder2,
        bookmark1: bookmark1,
        bookmark2: bookmark2,
        bookmark3: bookmark3,
        livemark1: livemark1,
        livemark2: livemark2,
        smartBookmark1: smartBookmark1,
        smartBookmark2: smartBookmark2
    };
}

exports.testSortOrder = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('title', false, undefined, false);
        
        prefs.folder_sort_order = 1;
        prefs.livemark_sort_order = 2;
        prefs.smart_bookmark_sort_order = 3;
        prefs.bookmark_sort_order = 4;
        
        let bookmarks = createSampleItems();
        
        yield bookmarkSorter.sortFolders(bookmarks.folder);
        
        assertBookmarksArray(assert, bookmarks.folder.getChildren()[0], [bookmarks.folder1, bookmarks.folder2, bookmarks.livemark2, bookmarks.livemark1, bookmarks.smartBookmark2, bookmarks.smartBookmark1, bookmarks.bookmark2, bookmarks.bookmark1, bookmarks.bookmark3]);
        assert.strictEqual(bookmarks.folder.getChildren().length, 1);
        
        prefs.folder_sort_order = 1;
        prefs.livemark_sort_order = 1;
        prefs.smart_bookmark_sort_order = 1;
        prefs.bookmark_sort_order = 1;
        
        deleteAllBookmarks();
        
        bookmarks = createSampleItems();
        
        yield bookmarkSorter.sortFolders(bookmarks.folder);
        assertBookmarksArray(assert, bookmarks.folder.getChildren()[0], [bookmarks.livemark2, bookmarks.bookmark2, bookmarks.folder1, bookmarks.folder2, bookmarks.smartBookmark2, bookmarks.livemark1, bookmarks.smartBookmark1, bookmarks.bookmark1, bookmarks.bookmark3]);
        assert.strictEqual(bookmarks.folder.getChildren().length, 1);
        
        prefs.folder_sort_order = 4;
        prefs.livemark_sort_order = 3;
        prefs.smart_bookmark_sort_order = 2;
        prefs.bookmark_sort_order = 1;
        
        deleteAllBookmarks();
        
        bookmarks = createSampleItems();
        
        yield bookmarkSorter.sortFolders(bookmarks.folder);
        assertBookmarksArray(assert, bookmarks.folder.getChildren()[0], [bookmarks.bookmark2, bookmarks.bookmark1, bookmarks.bookmark3, bookmarks.smartBookmark2, bookmarks.smartBookmark1, bookmarks.livemark2, bookmarks.livemark1, bookmarks.folder1, bookmarks.folder2]);
        assert.strictEqual(bookmarks.folder.getChildren().length, 1);
        
        prefs.folder_sort_order = 3;
        prefs.livemark_sort_order = 2;
        prefs.smart_bookmark_sort_order = 1;
        prefs.bookmark_sort_order = 4;
        
        deleteAllBookmarks();
        
        bookmarks = createSampleItems();
        
        yield bookmarkSorter.sortFolders(bookmarks.folder);
        assertBookmarksArray(assert, bookmarks.folder.getChildren()[0], [bookmarks.smartBookmark2, bookmarks.smartBookmark1, bookmarks.livemark2, bookmarks.livemark1, bookmarks.folder1, bookmarks.folder2, bookmarks.bookmark2, bookmarks.bookmark1, bookmarks.bookmark3]);
        assert.strictEqual(bookmarks.folder.getChildren().length, 1);
        
        prefs.folder_sort_order = 2;
        prefs.livemark_sort_order = 1;
        prefs.smart_bookmark_sort_order = 1;
        prefs.bookmark_sort_order = 2;
        
        deleteAllBookmarks();
        
        bookmarks = createSampleItems();
        
        yield bookmarkSorter.sortFolders(bookmarks.folder);
        assertBookmarksArray(assert, bookmarks.folder.getChildren()[0], [bookmarks.livemark2, bookmarks.smartBookmark2, bookmarks.livemark1, bookmarks.smartBookmark1, bookmarks.bookmark2, bookmarks.folder1, bookmarks.folder2, bookmarks.bookmark1, bookmarks.bookmark3]);
        assert.strictEqual(bookmarks.folder.getChildren().length, 1);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortByAccessCount = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('accessCount', false, undefined, false);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Title1', 'http://title1.com/', folder);
        yield setVisits(bookmark1, range(5));
        let bookmark2 = createBookmark('Test2', 'http://test2.com/', folder);
        yield setVisits(bookmark2, range(10));
        let bookmark3 = createBookmark('Abc3', 'http://abc3.com/', folder);
        yield setVisits(bookmark3, range(1));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark1, bookmark2]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark4 = createBookmark('Nice test4', 'http://nice4.com/', folder);
        yield setVisits(bookmark4, range(7));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark1, bookmark4, bookmark2]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark5 = createBookmark('Nice example5', 'http://example5.com/', folder);
        yield setVisits(bookmark5, range(2));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark5, bookmark1, bookmark4, bookmark2]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        createSeparator(folder);
        let bookmark6 = createBookmark('Testing6', 'http://testing6.com/', folder);
        yield setVisits(bookmark6, range(1));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark5, bookmark1, bookmark4, bookmark2]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6]);
        assert.strictEqual(folder.getChildren().length, 2);
        
        let bookmark7 = createBookmark('Nice test7', 'http://nice7.com/', folder);
        yield setVisits(bookmark7, range(4));
        
        createSeparator(folder);
        let bookmark8 = createBookmark('Test8', 'http://test8.com/', folder);
        yield setVisits(bookmark8, range(6));
        let bookmark9 = createBookmark('Abc9', 'http://abc9.com/', folder);
        yield setVisits(bookmark9, range(1));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark5, bookmark1, bookmark4, bookmark2]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6, bookmark7]);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark9, bookmark8]);
        assert.strictEqual(folder.getChildren().length, 3);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortByAccessCountAndLastVisited = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('accessCount', false, 'lastVisited', false);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Title1', 'http://title1.com/', folder);
        yield setVisits(bookmark1, range(5));
        let bookmark2 = createBookmark('Test2', 'http://test2.com/', folder);
        yield setVisits(bookmark2, [6, 7, 8, 9, 10]);
        let bookmark3 = createBookmark('Abc3', 'http://abc3.com/', folder);
        yield setVisits(bookmark3, range(1));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark1, bookmark2]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark4 = createBookmark('Nice test4', 'http://nice4.com/', folder);
        yield setVisits(bookmark4, [4, 5, 6, 7, 8]);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark1, bookmark4, bookmark2]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark5 = createBookmark('Nice example5', 'http://example5.com/', folder);
        yield setVisits(bookmark5, range(2));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark5, bookmark1, bookmark4, bookmark2]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        createSeparator(folder);
        let bookmark6 = createBookmark('Testing6', 'http://testing6.com/', folder);
        yield setVisits(bookmark6, range(1));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark5, bookmark1, bookmark4, bookmark2]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6]);
        assert.strictEqual(folder.getChildren().length, 2);
        
        let bookmark7 = createBookmark('Nice test7', 'http://nice7.com/', folder);
        yield setVisits(bookmark7, range(4));
        
        createSeparator(folder);
        let bookmark8 = createBookmark('Test8', 'http://test8.com/', folder);
        yield setVisits(bookmark8, range(6));
        let bookmark9 = createBookmark('Abc9', 'http://abc9.com/', folder);
        yield setVisits(bookmark9, range(1));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark5, bookmark1, bookmark4, bookmark2]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6, bookmark7]);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark9, bookmark8]);
        assert.strictEqual(folder.getChildren().length, 3);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortByAccessCountAndTitle = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('accessCount', false, 'title', false);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Titleds', 'http://titled1.com/', folder);
        yield setVisits(bookmark1, range(5));
        let bookmark2 = createBookmark('Tested', 'http://tested2.com/', folder);
        yield setVisits(bookmark2, range(5));
        let bookmark3 = createBookmark('Tested', 'http://abced3.com/', folder);
        yield setVisits(bookmark3, range(1));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark2, bookmark1]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark4 = createBookmark('Tested', 'http://niced4.com/', folder);
        yield setVisits(bookmark4, range(3));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark4, bookmark2, bookmark1]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark5 = createBookmark('Titled', 'http://exampled5.com/', folder);
        yield setVisits(bookmark5, range(5));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark4, bookmark2, bookmark5, bookmark1]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        createSeparator(folder);
        let bookmark6 = createBookmark('Testings6', 'http://testings6.com/', folder);
        yield setVisits(bookmark6, range(5));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark4, bookmark2, bookmark5, bookmark1]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6]);
        assert.strictEqual(folder.getChildren().length, 2);
        
        let bookmark7 = createBookmark('Nice tested7', 'http://niced7.com/', folder);
        yield setVisits(bookmark7, range(4));
        
        createSeparator(folder);
        let bookmark8 = createBookmark('Tested8', 'http://tested8.com/', folder);
        yield setVisits(bookmark8, range(6));
        let bookmark9 = createBookmark('Abced9', 'http://abced9.com/', folder);
        yield setVisits(bookmark9, range(1));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark4, bookmark2, bookmark5, bookmark1]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark7, bookmark6]);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark9, bookmark8]);
        assert.strictEqual(folder.getChildren().length, 3);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortByAccessCountReverseAndLastVisitedReverse = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('accessCount', true, 'lastVisited', true);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Title10', 'http://title10.com/', folder);
        yield setVisits(bookmark1, range(5));
        let bookmark2 = createBookmark('Test11', 'http://test11.com/', folder);
        yield setVisits(bookmark2, [6, 7, 8, 9, 10]);
        let bookmark3 = createBookmark('Abc12', 'http://abc12.com/', folder);
        yield setVisits(bookmark3, range(1));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark2, bookmark1, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark4 = createBookmark('Nice test13', 'http://nice13.com/', folder);
        yield setVisits(bookmark4, [4, 5, 6, 7, 8]);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark2, bookmark4, bookmark1, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark5 = createBookmark('Nice example14', 'http://example14.com/', folder);
        yield setVisits(bookmark5, range(2));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark2, bookmark4, bookmark1, bookmark5, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        createSeparator(folder);
        let bookmark6 = createBookmark('Testing15', 'http://testing15.com/', folder);
        yield setVisits(bookmark6, range(1));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark2, bookmark4, bookmark1, bookmark5, bookmark3]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6]);
        assert.strictEqual(folder.getChildren().length, 2);
        
        let bookmark7 = createBookmark('Nice test16', 'http://nice16.com/', folder);
        yield setVisits(bookmark7, range(4));
        
        createSeparator(folder);
        let bookmark8 = createBookmark('Test17', 'http://test17.com/', folder);
        yield setVisits(bookmark8, range(6));
        let bookmark9 = createBookmark('Abc18', 'http://abc18.com/', folder);
        yield setVisits(bookmark9, range(1));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark2, bookmark4, bookmark1, bookmark5, bookmark3]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark7, bookmark6]);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark8, bookmark9]);
        assert.strictEqual(folder.getChildren().length, 3);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortByDateAdded = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('lastModified', false, undefined, false);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Title', 'http://title.com/', folder);
        setDateAdded(bookmark1, 7000);
        let bookmark2 = createBookmark('Test', 'http://test.com/', folder);
        setDateAdded(bookmark2, 5000);
        let bookmark3 = createBookmark('Abc', 'http://abc.com/', folder);
        setDateAdded(bookmark3, 10000);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark2, bookmark1, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark4 = createBookmark('Nice test', 'http://nice.com/', folder);
        setDateAdded(bookmark4, 2000);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark2, bookmark1, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark5 = createBookmark('Nice example', 'http://example.com/', folder);
        setDateAdded(bookmark5, 1000);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark5, bookmark4, bookmark2, bookmark1, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        createSeparator(folder);
        let bookmark6 = createBookmark('Testing', 'http://testing.com/', folder);
        setDateAdded(bookmark6, 9000);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark5, bookmark4, bookmark2, bookmark1, bookmark3]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6]);
        assert.strictEqual(folder.getChildren().length, 2);
        
        let bookmark7 = createBookmark('Nice test', 'http://nice.com/', folder);
        setDateAdded(bookmark7, 6000);
        
        createSeparator(folder);
        let bookmark8 = createBookmark('Test', 'http://test.com/', folder);
        setDateAdded(bookmark8, 3000);
        let bookmark9 = createBookmark('Abc', 'http://abc.com/', folder);
        setDateAdded(bookmark9, 4000);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark5, bookmark4, bookmark2, bookmark1, bookmark3]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark7, bookmark6]);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark8, bookmark9]);
        assert.strictEqual(folder.getChildren().length, 3);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortByDescription = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('description', false, undefined, false);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Test', 'http://www.test.com/', folder);
        setDescription(bookmark1, 'Site Testing');
        let bookmark2 = createBookmark('Test Dot Com', 'http://test.com/', folder);
        setDescription(bookmark2, 'Test Site');
        let bookmark3 = createBookmark('Testing', 'http://abc.com/', folder)
        setDescription(bookmark3, 'Add-on Testing');
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark1, bookmark2]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark4 = createBookmark('Nice', 'http://testing.nice.com/', folder);
        setDescription(bookmark4, 'Nice Add-on');
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark4, bookmark1, bookmark2]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark5 = createBookmark('Nice', 'http://example.com/', folder);
        setDescription(bookmark5, 'Nice Example');
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark4, bookmark5, bookmark1, bookmark2]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        createSeparator(folder);
        let bookmark6 = createBookmark('Testing', 'http://testing.com/', folder);
        setDescription(bookmark6, 'Nice Testing');
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark4, bookmark5, bookmark1, bookmark2]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6]);
        assert.strictEqual(folder.getChildren().length, 2);
        
        let bookmark7 = createBookmark('Testing', 'http://nice.com/', folder);
        setDescription(bookmark7, 'Test Nice');
        
        createSeparator(folder);
        let bookmark8 = createBookmark('Testing', 'http://test.com/', folder);
        setDescription(bookmark8, 'Testing Nice');
        let bookmark9 = createBookmark('Nice', 'http://abc.com/', folder);
        setDescription(bookmark9, 'Nice Testing');
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark4, bookmark5, bookmark1, bookmark2]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6, bookmark7]);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark9, bookmark8]);
        assert.strictEqual(folder.getChildren().length, 3);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortByDescriptionAndTitle = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('description', false, 'title', false);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Site Testing', 'http://www.test.com/', folder);
        setDescription(bookmark1, 'Test');
        let bookmark2 = createBookmark('Test Site', 'http://test.com/', folder);
        setDescription(bookmark2, 'Test');
        let bookmark3 = createBookmark('Add-on Testing', 'http://abc.com/', folder)
        setDescription(bookmark3, 'Testing');
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark4 = createBookmark('Nice Add-on', 'http://testing.nice.com/', folder);
        setDescription(bookmark4, 'Nice');
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark1, bookmark2, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark5 = createBookmark('Nice Example', 'http://example.com/', folder);
        setDescription(bookmark5, 'Nice');
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark5, bookmark1, bookmark2, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        createSeparator(folder);
        let bookmark6 = createBookmark('Nice Testing', 'http://testing.com/', folder);
        setDescription(bookmark6, 'Testing');
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark5, bookmark1, bookmark2, bookmark3]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6]);
        assert.strictEqual(folder.getChildren().length, 2);
        
        let bookmark7 = createBookmark('Test Nice', 'http://nice.com/', folder);
        setDescription(bookmark7, 'Testing');
        
        createSeparator(folder);
        let bookmark8 = createBookmark('Testing Nice', 'http://test.com/', folder);
        setDescription(bookmark8, 'Testing');
        let bookmark9 = createBookmark('Nice Testing', 'http://abc.com/', folder);
        setDescription(bookmark9, 'Nice');
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark5, bookmark1, bookmark2, bookmark3]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6, bookmark7]);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark9, bookmark8]);
        assert.strictEqual(folder.getChildren().length, 3);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortByLastModified = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('lastModified', false, undefined, false);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Title', 'http://title.com/', folder);
        setLastModified(bookmark1, 7000);
        let bookmark2 = createBookmark('Test', 'http://test.com/', folder);
        setLastModified(bookmark2, 5000);
        let bookmark3 = createBookmark('Abc', 'http://abc.com/', folder);
        setLastModified(bookmark3, 10000);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark2, bookmark1, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark4 = createBookmark('Nice test', 'http://nice.com/', folder);
        setLastModified(bookmark4, 2000);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark2, bookmark1, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark5 = createBookmark('Nice example', 'http://example.com/', folder);
        setLastModified(bookmark5, 1000);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark5, bookmark4, bookmark2, bookmark1, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        createSeparator(folder);
        let bookmark6 = createBookmark('Testing', 'http://testing.com/', folder);
        setLastModified(bookmark6, 9000);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark5, bookmark4, bookmark2, bookmark1, bookmark3]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6]);
        assert.strictEqual(folder.getChildren().length, 2);
        
        let bookmark7 = createBookmark('Nice test', 'http://nice.com/', folder);
        setLastModified(bookmark7, 6000);
        
        createSeparator(folder);
        let bookmark8 = createBookmark('Test', 'http://test.com/', folder);
        setLastModified(bookmark8, 3000);
        let bookmark9 = createBookmark('Abc', 'http://abc.com/', folder);
        setLastModified(bookmark9, 4000);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark5, bookmark4, bookmark2, bookmark1, bookmark3]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark7, bookmark6]);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark8, bookmark9]);
        assert.strictEqual(folder.getChildren().length, 3);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortByLastVisited = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('lastVisited', false, undefined, false);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Title1', 'http://title1.com/', folder);
        yield setVisits(bookmark1, 5000);
        let bookmark2 = createBookmark('Test2', 'http://test2.com/', folder);
        yield setVisits(bookmark2, 10000);
        let bookmark3 = createBookmark('Abc3', 'http://abc3.com/', folder);
        yield setVisits(bookmark3, 420);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark1, bookmark2]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark4 = createBookmark('Nice test4', 'http://nice4.com/', folder);
        yield setVisits(bookmark4, 7000);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark1, bookmark4, bookmark2]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark5 = createBookmark('Nice example5', 'http://example5.com/', folder);
        yield setVisits(bookmark5, 2000);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark5, bookmark1, bookmark4, bookmark2]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        createSeparator(folder);
        let bookmark6 = createBookmark('Testing6', 'http://testing6.com/', folder);
        yield setVisits(bookmark6, 1000);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark5, bookmark1, bookmark4, bookmark2]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6]);
        assert.strictEqual(folder.getChildren().length, 2);
        
        let bookmark7 = createBookmark('Nice test7', 'http://nice7.com/', folder);
        yield setVisits(bookmark7, 4000);
        
        createSeparator(folder);
        let bookmark8 = createBookmark('Test8', 'http://test8.com/', folder);
        yield setVisits(bookmark8, 6000);
        let bookmark9 = createBookmark('Abc9', 'http://abc9.com/', folder);
        yield setVisits(bookmark9, 1000);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark5, bookmark1, bookmark4, bookmark2]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6, bookmark7]);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark9, bookmark8]);
        assert.strictEqual(folder.getChildren().length, 3);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortByKeyword = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('keyword', false, undefined, false);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Title', 'http://title.com/', folder);
        setKeyword(bookmark1, 'Keyword');
        let bookmark2 = createBookmark('Test', 'http://test.com/', folder);
        setKeyword(bookmark2, 'Test website');
        let bookmark3 = createBookmark('Abc', 'http://abc.com/', folder);
        setKeyword(bookmark3, 'Test abc');
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark3, bookmark2]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark4 = createBookmark('Nice test', 'http://nice.com/', folder);
        setKeyword(bookmark4, '1. Nice Test');
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark1, bookmark3, bookmark2]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark5 = createBookmark('Nice example', 'http://example.com/', folder);
        setKeyword(bookmark5, '1. Nice Example');
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark5, bookmark4, bookmark1, bookmark3, bookmark2]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        createSeparator(folder);
        let bookmark6 = createBookmark('Testing', 'http://testing.com/', folder);
        setKeyword(bookmark6, '1. Testing');
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark5, bookmark4, bookmark1, bookmark3, bookmark2]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6]);
        assert.strictEqual(folder.getChildren().length, 2);
        
        let bookmark7 = createBookmark('Nice test', 'http://nice.com/', folder);
        setKeyword(bookmark7, 'Testing nice');
        
        createSeparator(folder);
        let bookmark8 = createBookmark('Test', 'http://test.com/', folder);
        setKeyword(bookmark8, 'Testing site');
        let bookmark9 = createBookmark('Abc', 'http://abc.com/', folder);
        setKeyword(bookmark9, 'Testing abc');
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark5, bookmark4, bookmark1, bookmark3, bookmark2]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6, bookmark7]);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark9, bookmark8]);
        assert.strictEqual(folder.getChildren().length, 3);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortByTitle = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('title', false, undefined, false);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Title', 'http://title.com/', folder);
        let bookmark2 = createBookmark('Test', 'http://test.com/', folder);
        let bookmark3 = createBookmark('Abc', 'http://abc.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark2, bookmark1]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark4 = createBookmark('Nice test', 'http://nice.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark4, bookmark2, bookmark1]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark5 = createBookmark('Nice example', 'http://example.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark5, bookmark4, bookmark2, bookmark1]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        createSeparator(folder);
        let bookmark6 = createBookmark('Testing', 'http://testing.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark5, bookmark4, bookmark2, bookmark1]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6]);
        assert.strictEqual(folder.getChildren().length, 2);
        
        let bookmark7 = createBookmark('Nice test', 'http://nice.com/', folder);
        
        createSeparator(folder);
        let bookmark8 = createBookmark('Test', 'http://test.com/', folder);
        let bookmark9 = createBookmark('Abc', 'http://abc.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark5, bookmark4, bookmark2, bookmark1]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark7, bookmark6]);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark9, bookmark8]);
        assert.strictEqual(folder.getChildren().length, 3);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortByTitleAndAccessCount = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('title', false, 'accessCount', false);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Title', 'http://title1.com/', folder);
        yield setVisits(bookmark1, range(5));
        let bookmark2 = createBookmark('Test', 'http://test2.com/', folder);
        yield setVisits(bookmark2, range(10));
        let bookmark3 = createBookmark('Test', 'http://abc3.com/', folder);
        yield setVisits(bookmark3, range(1));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark2, bookmark1]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark4 = createBookmark('Test', 'http://nice4.com/', folder);
        yield setVisits(bookmark4, range(7));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark4, bookmark2, bookmark1]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark5 = createBookmark('Title', 'http://example5.com/', folder);
        yield setVisits(bookmark5, range(2));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark4, bookmark2, bookmark5, bookmark1]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        createSeparator(folder);
        let bookmark6 = createBookmark('Testing6', 'http://testing6.com/', folder);
        yield setVisits(bookmark6, range(1));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark4, bookmark2, bookmark5, bookmark1]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6]);
        assert.strictEqual(folder.getChildren().length, 2);
        
        let bookmark7 = createBookmark('Nice test7', 'http://nice7.com/', folder);
        yield setVisits(bookmark7, range(4));
        
        createSeparator(folder);
        let bookmark8 = createBookmark('Test8', 'http://test8.com/', folder);
        yield setVisits(bookmark8, range(6));
        let bookmark9 = createBookmark('Abc9', 'http://abc9.com/', folder);
        yield setVisits(bookmark9, range(1));
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark4, bookmark2, bookmark5, bookmark1]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark7, bookmark6]);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark9, bookmark8]);
        assert.strictEqual(folder.getChildren().length, 3);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortByTitleAndDescription = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('title', false, 'description', false);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Test', 'http://www.test.com/', folder);
        setDescription(bookmark1, 'Site Testing');
        let bookmark2 = createBookmark('Test', 'http://test.com/', folder);
        setDescription(bookmark2, 'Test Site');
        let bookmark3 = createBookmark('Testing', 'http://abc.com/', folder)
        setDescription(bookmark3, 'Add-on Testing');
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark4 = createBookmark('Nice', 'http://testing.nice.com/', folder);
        setDescription(bookmark4, 'Nice Add-on');
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark1, bookmark2, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark5 = createBookmark('Nice', 'http://example.com/', folder);
        setDescription(bookmark5, 'Nice Example');
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark5, bookmark1, bookmark2, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        createSeparator(folder);
        let bookmark6 = createBookmark('Testing', 'http://testing.com/', folder);
        setDescription(bookmark6, 'Nice Testing');
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark5, bookmark1, bookmark2, bookmark3]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6]);
        assert.strictEqual(folder.getChildren().length, 2);
        
        let bookmark7 = createBookmark('Testing', 'http://nice.com/', folder);
        setDescription(bookmark7, 'Test Nice');
        
        createSeparator(folder);
        let bookmark8 = createBookmark('Testing', 'http://test.com/', folder);
        setDescription(bookmark8, 'Testing Nice');
        let bookmark9 = createBookmark('Nice', 'http://abc.com/', folder);
        setDescription(bookmark9, 'Nice Testing');
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark5, bookmark1, bookmark2, bookmark3]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6, bookmark7]);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark9, bookmark8]);
        assert.strictEqual(folder.getChildren().length, 3);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortByTitleAndURL = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('title', false, 'url', false);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Test', 'http://www.test.com/', folder);
        let bookmark2 = createBookmark('Test', 'http://test.com/', folder);
        let bookmark3 = createBookmark('Testing', 'http://abc.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark2, bookmark1, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark4 = createBookmark('Nice', 'http://testing.nice.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark4, bookmark2, bookmark1, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark5 = createBookmark('Nice', 'http://example.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark5, bookmark4, bookmark2, bookmark1, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        createSeparator(folder);
        let bookmark6 = createBookmark('Testing', 'http://testing.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark5, bookmark4, bookmark2, bookmark1, bookmark3]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6]);
        assert.strictEqual(folder.getChildren().length, 2);
        
        let bookmark7 = createBookmark('Nice test', 'http://nice.com/', folder);
        
        createSeparator(folder);
        let bookmark8 = createBookmark('Testing', 'http://test.com/', folder);
        let bookmark9 = createBookmark('Nice', 'http://abc.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark5, bookmark4, bookmark2, bookmark1, bookmark3]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark7, bookmark6]);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark9, bookmark8]);
        assert.strictEqual(folder.getChildren().length, 3);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortByTitleReverse = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('title', true, undefined, false);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Title', 'http://title.com/', folder);
        let bookmark2 = createBookmark('Test', 'http://test.com/', folder);
        let bookmark3 = createBookmark('Abc', 'http://abc.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark4 = createBookmark('Nice test', 'http://nice.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2, bookmark4, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark5 = createBookmark('Nice example', 'http://example.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2, bookmark4, bookmark5, bookmark3]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        createSeparator(folder);
        let bookmark6 = createBookmark('Testing', 'http://testing.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2, bookmark4, bookmark5, bookmark3]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6]);
        assert.strictEqual(folder.getChildren().length, 2);
        
        let bookmark7 = createBookmark('Nice test', 'http://nice.com/', folder);
        
        createSeparator(folder);
        let bookmark8 = createBookmark('Test', 'http://test.com/', folder);
        let bookmark9 = createBookmark('Abc', 'http://abc.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark1, bookmark2, bookmark4, bookmark5, bookmark3]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6, bookmark7]);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark8, bookmark9]);
        assert.strictEqual(folder.getChildren().length, 3);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortByTitleReverseAndURL = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('title', true, 'url', false);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Test', 'http://www.test.com/', folder);
        let bookmark2 = createBookmark('Test', 'http://test.com/', folder);
        let bookmark3 = createBookmark('Testing', 'http://abc.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark2, bookmark1]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark4 = createBookmark('Nice', 'http://testing.nice.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark2, bookmark1, bookmark4]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark5 = createBookmark('Nice', 'http://example.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark2, bookmark1, bookmark5, bookmark4]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        createSeparator(folder);
        let bookmark6 = createBookmark('Testing', 'http://testing.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark2, bookmark1, bookmark5, bookmark4]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6]);
        assert.strictEqual(folder.getChildren().length, 2);
        
        let bookmark7 = createBookmark('Nice test', 'http://nice.com/', folder);
        
        createSeparator(folder);
        let bookmark8 = createBookmark('Testing', 'http://test.com/', folder);
        let bookmark9 = createBookmark('Nice', 'http://abc.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark2, bookmark1, bookmark5, bookmark4]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6, bookmark7]);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark8, bookmark9]);
        assert.strictEqual(folder.getChildren().length, 3);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortByTitleReverseAndURLReverse = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('title', true, 'url', true);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Test', 'http://www.test.com/', folder);
        let bookmark2 = createBookmark('Test', 'http://test.com/', folder);
        let bookmark3 = createBookmark('Testing', 'http://abc.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark1, bookmark2]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark4 = createBookmark('Nice', 'http://testing.nice.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark1, bookmark2, bookmark4]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark5 = createBookmark('Nice', 'http://example.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark1, bookmark2, bookmark4, bookmark5]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        createSeparator(folder);
        let bookmark6 = createBookmark('Testing', 'http://testing.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark1, bookmark2, bookmark4, bookmark5]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6]);
        assert.strictEqual(folder.getChildren().length, 2);
        
        let bookmark7 = createBookmark('Nice test', 'http://nice.com/', folder);
        
        createSeparator(folder);
        let bookmark8 = createBookmark('Testing', 'http://test.com/', folder);
        let bookmark9 = createBookmark('Nice', 'http://abc.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark1, bookmark2, bookmark4, bookmark5]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6, bookmark7]);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark8, bookmark9]);
        assert.strictEqual(folder.getChildren().length, 3);
        
        resetPreferences();
        
        done();
    });
};

exports.testSortByURL = function(assert, done) {
    spawn(function() {
        deleteAllBookmarks();
        
        let bookmarkSorter = new BookmarkSorter();
        bookmarkSorter.setCriteria('url', false, undefined, false);
        
        let folder = createFolder('Folder', menuFolder);
        
        let bookmark1 = createBookmark('Title', 'http://dev.title.com/', folder);
        let bookmark2 = createBookmark('Test', 'http://www.test.com/', folder);
        let bookmark3 = createBookmark('Abc', 'http://abc.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark1, bookmark2]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark4 = createBookmark('Nice test', 'http://nice.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark1, bookmark4, bookmark2]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        let bookmark5 = createBookmark('Nice example', 'http://www.example.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark1, bookmark4, bookmark5, bookmark2]);
        assert.strictEqual(folder.getChildren().length, 1);
        
        createSeparator(folder);
        let bookmark6 = createBookmark('Testing', 'http://testing.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark1, bookmark4, bookmark5, bookmark2]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6]);
        assert.strictEqual(folder.getChildren().length, 2);
        
        let bookmark7 = createBookmark('Nice test', 'http://www.nice.com/', folder);
        
        createSeparator(folder);
        let bookmark8 = createBookmark('Test', 'http://test.com/', folder);
        let bookmark9 = createBookmark('Abc', 'http://www.abc.com/', folder);
        
        yield bookmarkSorter.sortFolders(folder);
        assertBookmarksArray(assert, folder.getChildren()[0], [bookmark3, bookmark1, bookmark4, bookmark5, bookmark2]);
        assertBookmarksArray(assert, folder.getChildren()[1], [bookmark6, bookmark7]);
        assertBookmarksArray(assert, folder.getChildren()[2], [bookmark8, bookmark9]);
        assert.strictEqual(folder.getChildren().length, 3);
        
        resetPreferences();
        
        done();
    });
};

require('sdk/test').run(exports);
