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

const { set } = require('sdk/preferences/service'),
    simplePrefs = require('sdk/simple-prefs'),
    prefs = simplePrefs.prefs,
    { migrateOptions } = require('main'),
    { getOptionName } = require('options'),
    { resetPreferences } = require('./utils');

exports.testOptionsMigration = function(assert) {
    set(getOptionName('firstrun'), true);
    set('extensions.sortbookmarks.autosort', true);
    set('extensions.sortbookmarks.sortbar', true);
    set('extensions.sortbookmarks.order', JSON.stringify({bookmarks: '4', folders: '1', liveBookmarks: '2', smartBookmarks: '3'}));
    
    migrateOptions(false);
    
    assert.ok(prefs.auto_sort);
    assert.ok(prefs.sort_toolbar);
    assert.strictEqual(prefs.folder_sort_order, 1);
    assert.strictEqual(prefs.livemark_sort_order, 2);
    assert.strictEqual(prefs.smart_bookmark_sort_order, 3);
    assert.strictEqual(prefs.bookmark_sort_order, 4);
    
    set('extensions.sortbookmarks.autosort', false);
    set('extensions.sortbookmarks.sortbar', false);
    set('extensions.sortbookmarks.order', JSON.stringify({bookmarks: '1', folders: '1', liveBookmarks: '1', smartBookmarks: '1'}));
    
    migrateOptions(false);
    
    assert.strictEqual(prefs.auto_sort, false);
    assert.strictEqual(prefs.sort_toolbar, false);
    assert.strictEqual(prefs.folder_sort_order, 1);
    assert.strictEqual(prefs.livemark_sort_order, 1);
    assert.strictEqual(prefs.smart_bookmark_sort_order, 1);
    assert.strictEqual(prefs.bookmark_sort_order, 1);
    
    set('extensions.sortbookmarks.order', JSON.stringify({bookmarks: '2', folders: '1', liveBookmarks: '1', smartBookmarks: '2'}));
    
    migrateOptions(false);
    
    assert.strictEqual(prefs.auto_sort, false);
    assert.strictEqual(prefs.sort_toolbar, false);
    assert.strictEqual(prefs.folder_sort_order, 1);
    assert.strictEqual(prefs.livemark_sort_order, 1);
    assert.strictEqual(prefs.smart_bookmark_sort_order, 2);
    assert.strictEqual(prefs.bookmark_sort_order, 2);
    
    resetPreferences();
};

require('sdk/test').run(exports);
