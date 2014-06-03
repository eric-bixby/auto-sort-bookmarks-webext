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

const { Cc, Ci } = require('chrome'),
    annotationService = Cc['@mozilla.org/browser/annotation-service;1'].getService(Ci.nsIAnnotationService),
    descriptionAnnotation = 'bookmarkProperties/description',
    livemarkAnnotation = 'livemark/siteURI',
    smartBookmarkAnnotation = 'Places/SmartBookmark';

/**
 * Get the item description.
 * @param {int} itemID The item ID.
 * @return {string} The item description.
 */
function getDescription(item) {
    let description;
    try {
        description = annotationService.getItemAnnotation(item.id, descriptionAnnotation);
    }
    catch(exception) {
        description = '';
    }
    return description;
}

/**
 * Check whether `itemID` is a livemark.
 * @param {int} itemID The item ID.
 * @return {boolean} Whether the item is a livemark or not.
 */
function isLivemark(itemID) {
    return annotationService.itemHasAnnotation(itemID, livemarkAnnotation);
}

/**
 * Check whether `itemID` is a smart bookmark.
 * @param {int} itemID The item ID.
 * @return {boolean} Whether the item is a smart bookmark or not.
 */
function isSmartBookmark(itemID) {
    return annotationService.itemHasAnnotation(itemID, smartBookmarkAnnotation);
}

exports.getDescription = getDescription;
exports.isLivemark = isLivemark;
exports.isSmartBookmark = isSmartBookmark;
