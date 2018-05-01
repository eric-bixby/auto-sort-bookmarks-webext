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

/**
 * If enabled, send message to console for debugging.
 *
 * @param {*} o Message to display on console.
 */
function log(o) {
    // enable for debugging, disable prior to release.
    var logging = true;
    if (logging) {
        console.log(o);
    }
}

var self = module.exports = {

    /**
     * Remove an item annotation.
     *
     * @param {map} map The map.
     * @param {string} id The item ID.
     * @param {string} name The item name.
     */
    removeItemAnnotation: function (map, id, name) {
        if (map[id] !== undefined) {
            delete map[id];
        }
        self.setStoredAnnotationMap(name, map);
    },

    /**
     * Remove folders that no longer exist.
     * 
     * @param {map} map The map.
     * @param {array} folders The current existing folders.
     */
    removeMissingFolders: function (map, folders) {
        self.removeMissingFoldersForItem(map, folders, DONOTSORT);
        self.removeMissingFoldersForItem(map, folders, RECURSIVE);
    },

    /**
     * Remove folders that no longer exist.
     * 
     * @param {map} map The map.
     * @param {array} folders The current existing folders.
     * @param {string} name Name of storage item.
     */
    removeMissingFoldersForItem: function (map, folders, name) {
        if (map != undefined) {
            for (var id of Object.keys(map)) {
                var found = false;
                for (let folder of folders) {
                    if (folder.id === id) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    self.removeItemAnnotation(map, id, name);
                }
            }
        }
    },

    /**
     * Remove the do not sort annotation on an item.
     *
     * @param {map} map The map.
     * @param {string} id The item ID.
     */
    removeDoNotSortAnnotation: function (map, id) {
        self.removeItemAnnotation(map, id, DONOTSORT);
    },

    /**
     * Remove the recursive annotation on an item.
     *
     * @param {map} map The map.
     * @param {string} id The item ID.
     */
    removeRecursiveAnnotation: function (map, id) {
        self.removeItemAnnotation(map, id, RECURSIVE);
    },

    /**
     * Set an item annotation.
     *
     * @param {map} map The map.
     * @param {string} id The item ID.
     * @param name The item name.
     * @param value The item value.
     */
    setItemAnnotation: function (map, id, name, value) {
        if (map != undefined) {
            map[id] = value;
            self.setStoredAnnotationMap(name, map);
        }
    },

    /**
     * Set the do not sort annotation on an item.
     * 
     * @param {map} map The map.
     * @param {string} id The item ID.
     */
    setDoNotSortAnnotation: function (map, id) {
        self.setItemAnnotation(map, id, DONOTSORT, true);
    },

    /**
     * Set the recursive annotation on an item.
     * 
     * @param {map} map The map.
     * @param {string} id The item ID.
     */
    setRecursiveAnnotation: function (map, id) {
        self.setItemAnnotation(map, id, RECURSIVE, true);
    },

    /**
     * Set the stored annotation.
     * 
     * @param {string} name Key to save map to.
     * @param {*} map Map to be saved.
     */
    setStoredAnnotationMap: function (name, map) {
        var settings = {};
        settings[name] = map;
        log(settings);
        browser.storage.local.set(settings);
    }
};
