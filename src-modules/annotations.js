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

/* global module */

var self = module.exports = {

    /**
    * Get an item annotation.
    *
    * @param {string} id The item ID.
    * @param {string} name The item name.
    * @returns {*} The item annotation.
    */
    getItemAnnotation: function (id, name) {
        // TODO: get annotation from preferences or folder title
        console.log(id);
        console.log(name);
        return false;
    },

    /**
     * Check if an item has a do not sort annotation.
     *
     * @param {string} id The item ID.
     * @return {boolean} Whether the item has a do not sort annotation.
     */
    hasDoNotSortAnnotation: function (id) {
        return self.getItemAnnotation(id, "donotsort");
    },

    /**
     * Check if an item has a recursive annotation.
     *
     * @param {string} id The item ID.
     * @return {boolean} Whether the item has a recursive annotation.
     */
    hasRecursiveAnnotation: function (id) {
        return self.getItemAnnotation(id, "recursive");
    },

    /**
     * Check if an item is recursively excluded.
     *
     * @param {string} id The item ID.
     * @return {boolean} Whether the item is recursively excluded.
     */
    isRecursivelyExcluded: function (id) {
        return self.hasDoNotSortAnnotation(id) && self.hasRecursiveAnnotation(id);
    },

    /**
    * Remove an item annotation.
    *
    * @param {string} id The item ID.
    * @param {string} name The item name.
    */
    removeItemAnnotation: function (id, name) {
        // TODO: chrome does not have annotations, what about tags?
        console.log(id);
        console.log(name);
    },

    /**
     * Remove the do not sort annotation on an item.
     *
     * @param {string} id The item ID.
     */
    removeDoNotSortAnnotation: function (id) {
        self.removeItemAnnotation(id, "autosortbookmarks/donotsort");
    },

    /**
     * Remove the recursive annotation on an item.
     *
     * @param {string} id The item ID.
     */
    removeRecursiveAnnotation: function (id) {
        self.removeItemAnnotation(id, "autosortbookmarks/recursive");
    },

    /**
     * Set an item annotation.
     *
     * @param {string} id The item ID.
     * @param name The item name.
     * @param value The item value.
     */
    setItemAnnotation: function (id, name, value) {
        // TODO: chrome does not have annotations, what about tags?
        console.log(id);
        console.log(name);
        console.log(value);
    },

    /**
     * Set the do not sort annotation on an item.
     * 
     * @param {string} id The item ID.
     */
    setDoNotSortAnnotation: function (id) {
        self.setItemAnnotation(id, "autosortbookmarks/donotsort", true);
    },

    /**
     * Set the recursive annotation on an item.
     * @param {string} id The item ID.
     */
    setRecursiveAnnotation: function (id) {
        self.setItemAnnotation(id, "autosortbookmarks/recursive", true);
    }

};
