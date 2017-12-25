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

const DONOTSORT = "donotsort", RECURSIVE = "recursive";

var self = module.exports = {

    /**
    * Get an item annotation.
    *
    * @param {string} id The item ID.
    * @param {string} name The item name.
    * @returns {*} The item annotation.
    */
    getItemAnnotation: function (id, name) {
        var map = JSON.parse(localStorage.getItem(name)) || new Map();
        return map[id] || false;
    },

    /**
     * Check if an item has a do not sort annotation.
     *
     * @param {string} id The item ID.
     * @return {boolean} Whether the item has a do not sort annotation.
     */
    hasDoNotSortAnnotation: function (id) {
        return self.getItemAnnotation(id, DONOTSORT);
    },

    /**
     * Check if an item has a recursive annotation.
     *
     * @param {string} id The item ID.
     * @return {boolean} Whether the item has a recursive annotation.
     */
    hasRecursiveAnnotation: function (id) {
        return self.getItemAnnotation(id, RECURSIVE);
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
        var map = JSON.parse(localStorage.getItem(name)) || new Map();
        if (map[id] !== undefined) {
            delete map[id];
        }
        localStorage.setItem(name, JSON.stringify(map));
    },

    /**
     * Remove the do not sort annotation on an item.
     *
     * @param {string} id The item ID.
     */
    removeDoNotSortAnnotation: function (id) {
        self.removeItemAnnotation(id, DONOTSORT);
    },

    /**
     * Remove the recursive annotation on an item.
     *
     * @param {string} id The item ID.
     */
    removeRecursiveAnnotation: function (id) {
        self.removeItemAnnotation(id, RECURSIVE);
    },

    /**
     * Set an item annotation.
     *
     * @param {string} id The item ID.
     * @param name The item name.
     * @param value The item value.
     */
    setItemAnnotation: function (id, name, value) {
        var map = JSON.parse(localStorage.getItem(name)) || new Map();
        map[id] = value;
        localStorage.setItem(name, JSON.stringify(map));
    },

    /**
     * Set the do not sort annotation on an item.
     * 
     * @param {string} id The item ID.
     */
    setDoNotSortAnnotation: function (id) {
        self.setItemAnnotation(id, DONOTSORT, true);
    },

    /**
     * Set the recursive annotation on an item.
     * @param {string} id The item ID.
     */
    setRecursiveAnnotation: function (id) {
        self.setItemAnnotation(id, RECURSIVE, true);
    }
};
