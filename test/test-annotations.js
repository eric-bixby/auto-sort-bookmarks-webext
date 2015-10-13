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

const { getDescription, isLivemark, isSmartBookmark } = require('lib/annotations'),
    { Bookmark, menuFolder } = require('lib/bookmarks'),
    { createBookmark, createFolder, createLivemark, createSeparator, createSmartBookmark, setDescription } = require('./utils');

exports.testDescription = function(assert) {
    assert.strictEqual(getDescription(undefined), '');
    
    let item = createBookmark('Test title', 'http://test.url/', menuFolder);
    assert.strictEqual(getDescription(item), '');
    
    setDescription(item, 'Test description');
    assert.strictEqual(getDescription(item), 'Test description');
    
    setDescription(item, 'New description');
    assert.strictEqual(getDescription(item), 'New description');
};

exports.testLivemark = function(assert) {
    let item = createBookmark('Test title', 'http://test.url/', menuFolder);
    assert.strictEqual(isLivemark(item.id), false);
    
    item = createLivemark('Stack Overflow', 'http://stackoverflow.com/feeds', menuFolder);
    assert.strictEqual(isLivemark(item.id), true);
    
    item = createFolder('Test Folder', menuFolder);
    assert.strictEqual(isLivemark(item.id), false);
    
    item = createSmartBookmark('Test Smart Bookmark', 'MostVisited', 'place:sort=8&maxResults=10', menuFolder);
    assert.strictEqual(isLivemark(item.id), false);
    
    item = createSeparator(menuFolder);
    assert.strictEqual(isLivemark(item.id), false);
};

exports.testSmartBookmark = function(assert) {
    let item = createBookmark('Test title', 'http://test.url/', menuFolder);
    assert.strictEqual(isSmartBookmark(item.id), false);
    
    item = createLivemark('Stack Overflow', 'http://stackoverflow.com/feeds', menuFolder);
    assert.strictEqual(isSmartBookmark(item.id), false);
    
    item = createFolder('Test Folder', menuFolder);
    assert.strictEqual(isSmartBookmark(item.id), false);
    
    item = createSmartBookmark('Test Smart Bookmark', 'MostVisited', 'place:sort=8&maxResults=10', menuFolder);
    assert.strictEqual(isSmartBookmark(item.id), true);
    
    item = createSeparator(menuFolder);
    assert.strictEqual(isSmartBookmark(item.id), false);
};

require('sdk/test').run(exports);
