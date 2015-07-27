/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, unused:true, curly:true, moz:true, indent:4, maxerr:50, globalstrict: true */
/*global require: false, exports: false */

/*
 * Copyright (C) 2014  Boucher, Antoni <bouanto@zoho.com>
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
    windowUtils = require('sdk/window/utils'),
    { sleep, spawn } = require('./task'),
    { openWindow, showBookmarksManager } = require('./utils'),
    { createEvents, createMenus } = require('main');

/**
 * Test that the menu are hidden when the window open and the options are set to false.
 */
exports.testHideMenuItems = function(assert, done) {
    spawn(function() {
        prefs.show_tools_menu_item = false;
        prefs.show_bookmarks_manager_menu_item = false;
        prefs.show_bookmarks_menu_item = false;
        prefs.show_bookmarks_toolbar_menu_item = false;
        
        createEvents();
        createMenus();
        
        let toolMenuItem = windowUtils.getMostRecentBrowserWindow().document.getElementById('auto-sort-bookmarks-sort-all-tools-menu');
        
        assert.strictEqual(toolMenuItem.style.display, 'none');
        
        let bookmarksMenuItem = windowUtils.getMostRecentBrowserWindow().document.getElementById('auto-sort-bookmarks-sort-all-bookmarks-menu');
        let bookmarksAppMenuItem = windowUtils.getMostRecentBrowserWindow().document.getElementById('auto-sort-bookmarks-sort-all-bookmarks-app-menu');
        
        assert.strictEqual(bookmarksMenuItem.style.display, 'none');
        assert.strictEqual(bookmarksAppMenuItem.style.display, 'none');
        
        toolbarMenuItem = windowUtils.getMostRecentBrowserWindow().document.getElementById('auto-sort-bookmarks-sort-all-bookmarks-toolbar-menu');
        
        assert.strictEqual(toolbarMenuItem.style.display, 'none');
        
        let window = yield showBookmarksManager();
        
        let bookmarksManagerMenuItem = window.document.getElementById('auto-sort-bookmarks-sort-all-bookmarks-organiser-menu');
        
        assert.strictEqual(bookmarksManagerMenuItem.style.display, 'none');
        
        yield openWindow();
        
        toolMenuItem = windowUtils.getMostRecentBrowserWindow().document.getElementById('auto-sort-bookmarks-sort-all-tools-menu');
        
        assert.strictEqual(toolMenuItem.style.display, 'none');
        
        bookmarksMenuItem = windowUtils.getMostRecentBrowserWindow().document.getElementById('auto-sort-bookmarks-sort-all-bookmarks-menu');
        bookmarksAppMenuItem = windowUtils.getMostRecentBrowserWindow().document.getElementById('auto-sort-bookmarks-sort-all-bookmarks-app-menu');
        
        assert.strictEqual(bookmarksMenuItem.style.display, 'none');
        assert.strictEqual(bookmarksAppMenuItem.style.display, 'none');
        
        toolbarMenuItem = windowUtils.getMostRecentBrowserWindow().document.getElementById('auto-sort-bookmarks-sort-all-bookmarks-toolbar-menu');
        
        assert.strictEqual(toolbarMenuItem.style.display, 'none');
        
        prefs.show_tools_menu_item = true;
        prefs.show_bookmarks_manager_menu_item = true;
        prefs.show_bookmarks_menu_item = true;
        prefs.show_bookmarks_toolbar_menu_item = true;
        
        done();
    });
};

/**
 * Test the display options for the tools menu item.
 */
exports.testShowToolsMenuItem = function(assert) {
    createEvents();
    createMenus();
    
    prefs.show_tools_menu_item = false;
    
    let toolMenuItem = windowUtils.getMostRecentBrowserWindow().document.getElementById('auto-sort-bookmarks-sort-all-tools-menu');
    
    assert.strictEqual(toolMenuItem.style.display, 'none');
    
    prefs.show_tools_menu_item = true;
    
    assert.strictEqual(toolMenuItem.style.display, '');
};

/**
 * Test the display options for the bookmarks manager organise menu item.
 */
exports.testShowBookmarksManagerMenuItem = function(assert, done) {
    spawn(function() {
        createEvents();
        createMenus();
        
        let window = yield showBookmarksManager();
        
        prefs.show_bookmarks_manager_menu_item = false;
        
        let bookmarksManagerMenuItem = window.document.getElementById('auto-sort-bookmarks-sort-all-bookmarks-organiser-menu');
        
        assert.strictEqual(bookmarksManagerMenuItem.style.display, 'none');
        
        prefs.show_bookmarks_manager_menu_item = true;
        
        assert.strictEqual(bookmarksManagerMenuItem.style.display, '');
        
        done();
    });
};

/**
 * Test the display options for the bookmarks menu item.
 */
exports.testShowBookmarksMenuItem = function(assert) {
    createEvents();
    createMenus();
    
    prefs.show_bookmarks_menu_item = false;
    
    let bookmarksMenuItem = windowUtils.getMostRecentBrowserWindow().document.getElementById('auto-sort-bookmarks-sort-all-bookmarks-menu');
    let bookmarksAppMenuItem = windowUtils.getMostRecentBrowserWindow().document.getElementById('auto-sort-bookmarks-sort-all-bookmarks-app-menu');
    
    assert.strictEqual(bookmarksMenuItem.style.display, 'none');
    assert.strictEqual(bookmarksAppMenuItem.style.display, 'none');
    
    prefs.show_bookmarks_menu_item = true;
    
    assert.strictEqual(bookmarksMenuItem.style.display, '');
    assert.strictEqual(bookmarksAppMenuItem.style.display, '');
};

/**
 * Test the display options for the toolbar menu item.
 */
exports.testShowToolbarMenuItem = function(assert) {
    createEvents();
    createMenus();
    
    prefs.show_bookmarks_toolbar_menu_item = false;
    
    let toolbarMenuItem = windowUtils.getMostRecentBrowserWindow().document.getElementById('auto-sort-bookmarks-sort-all-bookmarks-toolbar-menu');
    
    assert.strictEqual(toolbarMenuItem.style.display, 'none');
    
    prefs.show_bookmarks_toolbar_menu_item = true;
    
    assert.strictEqual(toolbarMenuItem.style.display, '');
};

require('sdk/test').run(exports);
