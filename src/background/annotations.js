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

"use strict";

/* global annotationService, Bookmark, descriptionAnnotation, livemarkAnnotation, smartBookmarkAnnotation */

/* exported getDescription, isRecursivelyExcluded, isLivemark, isSmartBookmark, removeDoNotSortAnnotation, removeRecursiveAnnotation, setDoNotSortAnnotation, setRecursiveAnnotation */

/**
 * Get the item description.
 *
 * @param {*} item The item.
 * @return {*} The item description.
 */
function getDescription(item) {
    let description;
    try {
        description = annotationService.getItemAnnotation(item.id, descriptionAnnotation);
    }
    catch (exception) {
        description = "";
    }

    return description;
}

/**
 * Get an item annotation.
 *
 * @param itemID The item ID.
 * @param name The item name.
 * @returns {*} The item annotation.
 */
function getItemAnnotation(itemID, name) {
    let annotation;
    try {
        annotation = annotationService.getItemAnnotation(itemID, name);
    }
    catch (exception) {
        // Do nothing.
    }

    return annotation;
}

/**
 * Check if an item has a do not sort annotation.
 *
 * @param itemID
 * @return {boolean}
 */
function hasDoNotSortAnnotation(itemID) {
    let annotation = getItemAnnotation(itemID, "autosortbookmarks/donotsort");
    return annotation !== undefined;
}

/**
 * Check if an item has a recursive annotation.
 *
 * @param itemID
 * @return {boolean}
 */
function hasRecursiveAnnotation(itemID) {
    let annotation = getItemAnnotation(itemID, "autosortbookmarks/recursive");
    return annotation !== undefined;
}

/**
 * Check if an item is recursively excluded.
 *
 * @param itemID
 * @return {boolean}
 */
function isRecursivelyExcluded(itemID) {
    return hasDoNotSortAnnotation(itemID) && hasRecursiveAnnotation(itemID);
}

/**
 * Check whether `itemID` is a livemark.
 *
 * @param {int} itemID The item ID.
 * @return {*} Whether the item is a livemark or not.
 */
function isLivemark(itemID) {
    return annotationService.itemHasAnnotation(itemID, livemarkAnnotation);
}

/**
 * Check whether `itemID` is a smart bookmark.
 *
 * @param {int} itemID The item ID.
 * @return {boolean} Whether the item is a smart bookmark or not.
 */
function isSmartBookmark(itemID) {
    return annotationService.itemHasAnnotation(itemID, smartBookmarkAnnotation);
}

/**
 * Remove an item annotation.
 *
 * @param itemID
 * @param name
 */
function removeItemAnnotation(itemID, name) {
    annotationService.removeItemAnnotation(itemID, name);
}

/**
 * Remove the do not sort annotation on an item.
 *
 * @param itemID
 */
function removeDoNotSortAnnotation(itemID) {
    removeItemAnnotation(itemID, "autosortbookmarks/donotsort");
}

/**
 * Remove the recursive annotation on an item.
 *
 * @param itemID
 */
function removeRecursiveAnnotation(itemID) {
    removeItemAnnotation(itemID, "autosortbookmarks/recursive");
}

/**
 * Set an item annotation.
 *
 * @param itemID
 * @param name
 * @param value
 */
function setItemAnnotation(itemID, name, value) {
    if (Bookmark.exists(itemID)) {
        annotationService.setItemAnnotation(itemID, name, value, 0, annotationService.EXPIRE_NEVER);
    }
}

/**
 * Set the do not sort annotation on an item.
 * @param itemID
 */
function setDoNotSortAnnotation(itemID) {
    setItemAnnotation(itemID, "autosortbookmarks/donotsort", true);
}

/**
 * Set the recursive annotation on an item.
 * @param itemID
 */
function setRecursiveAnnotation(itemID) {
    setItemAnnotation(itemID, "autosortbookmarks/recursive", true);
}
