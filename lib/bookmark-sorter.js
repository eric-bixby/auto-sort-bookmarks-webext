/* jshint bitwise: true, browser: true, curly: true, eqeqeq: true, forin: true, freeze: true, immed: true, indent: 4, latedef: true, moz: true, newcap: true, noarg: true, noempty: true, nonbsp: true, nonew: true, quotmark: single, undef: true, unused: true, strict: true */
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

const { Class } = require('sdk/core/heritage'),
    { defer } = require('sdk/core/promise'),
    { prefs } = require('sdk/simple-prefs'),
    { Folder, menuFolder, Separator, toolbarFolder, unsortedFolder } = require('bookmarks'),
    { Thread } = require('thread');

/**
 * Bookmark sorter class.
 */
let BookmarkSorter = new Class({
    /**
     * Get a bookmark sorter.
     * @constructor
     */
    initialize: function() {
    },
    /**
     * Bookmark comparator.
     * @param {Item} bookmark1 The first bookmark.
     * @param {Item} bookmark2 The second bookmark.
     */
    compare: function(bookmark1, bookmark2) {
        if(bookmark1.order !== bookmark2.order) {
            return bookmark1.order - bookmark2.order;
        }
        let result;
        if(['title', 'url', 'description', 'keyword'].indexOf(BookmarkSorter.prototype.firstSortCriteria) !== -1) {
            result = bookmark1[BookmarkSorter.prototype.firstSortCriteria].localeCompare(bookmark2[BookmarkSorter.prototype.firstSortCriteria]) * BookmarkSorter.prototype.firstReverse;
        }
        else {
            result = (bookmark1[BookmarkSorter.prototype.firstSortCriteria] - bookmark2[BookmarkSorter.prototype.firstSortCriteria]) * BookmarkSorter.prototype.firstReverse;
        }
        if(result === 0 && BookmarkSorter.prototype.secondSortCriteria !== undefined) {
            if(['title', 'url', 'description', 'keyword'].indexOf(BookmarkSorter.prototype.secondSortCriteria) !== -1) {
                result = bookmark1[BookmarkSorter.prototype.secondSortCriteria].localeCompare(bookmark2[BookmarkSorter.prototype.secondSortCriteria]) * BookmarkSorter.prototype.secondReverse;
            }
            else {
                result = (bookmark1[BookmarkSorter.prototype.secondSortCriteria] - bookmark2[BookmarkSorter.prototype.secondSortCriteria]) * BookmarkSorter.prototype.secondReverse;
            }
        }
        
        return result;
    },
    foldersToSort: [],
    /**
     * Get all the folders as a flat list.
     * @return {Array.<Folder>} The folders.
     */
    getAllFolders: function() {
        let folders = [];
        
        if(prefs.sort_menu) {
            folders.push(menuFolder);
            yield menuFolder;
        }
        
        if(prefs.sort_toolbar) {
            folders.push(toolbarFolder);
            yield toolbarFolder;
        }
        
        if(prefs.sort_unsorted) {
            folders.push(unsortedFolder);
            yield unsortedFolder;
        }
        
        for(let i = 0, length = folders.length ; i < length ; ++i) {
            for(let folder in folders[i].getFolders()) {
                yield folder;
            }
        }
    },
    isSorting: false,
    /**
     * Check if `folderToCheck` is about to be sorted.
     * @param {Folder} folderToCheck The folder to check.
     * @return {boolean} Whether the folder is about to be sorted or not.
     */
    isToBeSorted: function(folderToCheck) {
        for(let folder of this.foldersToSort) {
            if(folderToCheck.id === folder.id) {
                return true;
            }
        }
        return false;
    },
    /**
     * Set the sort criteria.
     * @param {string} firstSortCriteria The first sort criteria attribute.
     * @param {boolean} firstReverse Whether the first sort is reversed.
     * @param {string} secondReverse The second sort criteria attribute.
     * @param {boolean} secondReverse Whether the second sort is reversed.
     */
    setCriteria: function(firstSortCriteria, firstReverse, secondSortCriteria, secondReverse) {
        BookmarkSorter.prototype.firstReverse = firstReverse ? -1 : 1;
        BookmarkSorter.prototype.firstSortCriteria = firstSortCriteria;
        BookmarkSorter.prototype.secondReverse = secondReverse ? -1 : 1;
        BookmarkSorter.prototype.secondSortCriteria = secondSortCriteria;
    },
    /**
     * Generator sorting all bookmarks.
     */
    sortAllBookmarks: function() {
        return this.sortFolders(this.getAllFolders());
    },
    /**
     * Generator sorting and saving a folder.
     * @param {Folder} folder The folder to sort and save.
     */
    sortAndSave: function(folder) {
        if(folder.canBeSorted()) {
            this.sortFolder(folder);
            
            yield undefined;
            
            for(let _ in folder.save()) {
                yield undefined;
            }
        }
    },
    /**
     * Sort the `folder` children.
     * @param {Folder} folder The folder to sort.
     */
    sortFolder: function(folder) {
        folder.getChildren();
        
        let delta = 0;
        let length;
        
        for(let i = 0 ; i < folder.children.length ; ++i) {
            folder.children[i].sort(this.compare);
            length = folder.children[i].length;
            for(let j = 0 ; j < length ; ++j) {
                folder.children[i][j].setIndex(j + delta);
            }
            delta += length + 1;
        }
    },
    /**
     * Sort the `folders`.
     * @param {Array.<Folder>|Folder} folders The folders to sort.
     * @param {int} time The time before sorting in milliseconds.
     */
    sortFolders: function(folders, time) {
        let deferred = defer();
        
        folders = folders instanceof Folder ? [folders] : folders;
        time = time !== undefined ? time : 0;
        
        if(this.isSorting) {
            this.sortLater(folders);
        }
        else {
            let self = this;
            
            this.thread = new Thread(function() {
                if(self.isSorting) {
                    self.sortLater(folders);
                    yield false;
                }
                
                self.isSorting = true;
                
                yield true;
                
                for(let folder of folders) {
                    for(let _ in self.sortAndSave(folder)) {
                        yield true;
                    }
                }
                
                while(self.foldersToSort.length > 0) {
                    for(let _ in self.sortAndSave(self.foldersToSort[0])) {
                        yield true;
                    }
                    self.foldersToSort.splice(0, 1);
                }
                
                self.isSorting = false;
                
                deferred.resolve();
                
                yield false;
            }, time);
        }
        
        return deferred.promise;
    },
    /**
     * Sort `folders` later.
     * @param {Array.<Folder>|Folder} folders The folders to sort later.
     */
    sortLater: function(folders) {
        for(let folder of folders) {
            if(!this.isToBeSorted(folder) && folder.canBeSorted()) {
                this.foldersToSort.push(folder);
            }
        }
    },
    /**
     * Start the sorting thread.
     */
    start: function() {
        if(this.isSorting) {
            this.thread.start();
        }
    },
    /**
     * Stop the sorting thread.
     */
    stop: function() {
        if(this.thread) {
            this.thread.stop();
        }
    },
    thread: null
});

exports.BookmarkSorter = BookmarkSorter;
